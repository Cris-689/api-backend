pipeline {
    agent any

    environment {
        // Definimos el nuevo repositorio de Docker
        IMAGE_NAME = "uzbuzbiz/api-backend"
        // Nombre de la entrega en Helm
        HELM_RELEASE_NAME = "api-release"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                script {
                    // Construimos la imagen con el tag del Build ID de Jenkins
                    sh "docker build -t ${IMAGE_NAME}:${env.BUILD_ID} ."
                    sh "docker build -t ${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Push Image') {
            steps {
                script {
                    // Subimos ambas versiones al registro de Docker
                    sh "docker push ${IMAGE_NAME}:${env.BUILD_ID}"
                    sh "docker push ${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Deploy with Helm') {
            steps {
                script {
                    // Ejecutamos el despliegue usando la carpeta /helm
                    // No pasamos contraseñas aquí porque Helm las leerá del secreto 'backend-db-secrets'
                    sh """
                    helm upgrade --install ${HELM_RELEASE_NAME} ./helm \
                        --set image.tag=${env.BUILD_ID} \
                        --wait
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Despliegue en api.uzbuzbiz.es completado con éxito."
        }
        failure {
            echo "El despliegue ha fallado. Revisa los logs con: helm status ${HELM_RELEASE_NAME}"
        }
    }
}