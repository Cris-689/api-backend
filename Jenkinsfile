pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: docker
    image: docker:latest
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
        // Usamos tu usuario de Docker Hub
        DOCKER_USER_HUB = "uzbuzbiz" 
        DOCKER_IMAGE    = "${DOCKER_USER_HUB}/api-nest"
        REGISTRY_CRED   = "docker-hub-creds"
    }

    stages {
        stage('Preparar y Construir') {
            steps {
                container('docker') {
                    script {
                        // Construimos con el tag de build actual y con latest para referencia
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
                        // Subimos ambas versiones
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
                        // 1. Aseguramos que la infraestructura base esté aplicada
                        sh "kubectl apply -f k8s/postgres-db.yaml -n jenkins"
                        sh "kubectl apply -f k8s/ingress.yaml -n jenkins"
                        sh "kubectl apply -f k8s/Deployment.yaml -n jenkins"

                        // 2. Actualizamos la imagen del Deployment con el nuevo tag
                        sh "kubectl set image deployment/backend-api backend=${DOCKER_IMAGE}:${BUILD_NUMBER} -n jenkins"
                        // 3. Verificamos el estado del despliegue en tiempo real
                        sh "kubectl rollout status deployment/backend-api -n jenkins"
                    }
                }
            }
        }
    }
    
    post {
        always {
            container('docker') {
                sh "docker logout"
            }
        }
    }
}