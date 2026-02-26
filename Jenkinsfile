pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsUser: 1000
    fsGroup: 1000
  containers:
  - name: docker
    image: docker:latest
    securityContext:
      runAsUser: 0
    command: ['sleep', 'infinity']
    volumeMounts:
    - name: dockersock
      mountPath: /var/run/docker.sock
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ['sleep', 'infinity']
  volumes:
  - name: dockersock
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }

    environment {
        DOCKER_USER_HUB = "uzbuzbiz"
        DOCKER_IMAGE    = "${DOCKER_USER_HUB}/api-nest"
        REGISTRY_CRED   = "docker-hub-creds"
        DOCKER_CONFIG   = "${WORKSPACE}/.docker" 
    }

    stages {
        stage('Construir Imagen') {
            steps {
                container('docker') {
                    script {
                        sh "mkdir -p ${DOCKER_CONFIG}"
                        sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} -t ${DOCKER_IMAGE}:latest ."
                    }
                }
            }
        }

        stage('Push a Docker Hub') {
            steps {
                container('docker') {
                    withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED}", usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        sh "echo \$PASS | docker login -u \$USER --password-stdin"
                        sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                        sh "docker push ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Desplegar en Kubernetes') {
            steps {
                container('kubectl') {
                    script {
                        // Aplicamos los archivos de configuración desde la carpeta k8s
                        sh "kubectl apply -f k8s/postgres-db.yaml -n jenkins"
                        sh "kubectl apply -f k8s/ingress.yaml -n jenkins"
                        sh "kubectl apply -f k8s/Deployment.yaml -n jenkins"

                        // Actualización de la imagen con el nuevo tag para forzar el rollout
                        sh "kubectl set image deployment/backend-api api-nest=${DOCKER_IMAGE}:${BUILD_NUMBER} -n jenkins"

                        // Verificación del estado del despliegue
                        sh "kubectl rollout status deployment/backend-api -n jenkins"
                    }
                }
            }
        }
    }
    
    post {
        always {
            container('docker') {
                // Limpiar las credenciales uasdas
                sh "docker logout"
                // Limpiar la carpeta temporal de config
                sh "rm -rf ${DOCKER_CONFIG}"
            }
        }
    }
}