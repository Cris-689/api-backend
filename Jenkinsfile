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
    securityContext:
      runAsUser: 1000
  volumes:
  - name: dockersock
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }

    environment {
        DOCKER_IMAGE = "uzbuzbiz/api-nest"
        REGISTRY_CRED = "Docker Hub Acceso" // El ID que pusiste en Jenkins
    }

    stages {
        stage('Construir Imagen') {
            steps {
                container('docker') {
                    script {
                        // Construimos la imagen usando el Dockerfile de la raíz
                        sh "docker build -t ${DOCKER_IMAGE}:latest ."
                    }
                }
            }
        }

        stage('Subir a Docker Hub') {
            steps {
                container('docker') {
                    withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                        sh "docker push ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Desplegar en Kubernetes') {
            steps {
                container('kubectl') {
                    script {
                        // 1. Desplegamos la base de datos primero
                        sh "kubectl apply -f k8s/postgres-db.yaml"
                        // 2. Desplegamos la API
                        sh "kubectl apply -f k8s/deployment.yaml"
                        
                        // Forzamos el reinicio para que pille la imagen nueva
                        sh "kubectl rollout restart deployment backend-api -n jenkins"
                    }
                }
            }
        }
    }
}
