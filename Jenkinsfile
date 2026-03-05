pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command: ["/busybox/cat"]
    tty: true
    volumeMounts:
      - name: kaniko-secret
        mountPath: /kaniko/.docker
  - name: helm
    image: alpine/helm:latest
    command: ["/bin/sh", "-c"]
    args: ["tail -f /dev/null"]
  volumes:
    - name: kaniko-secret
      emptyDir: {}
'''
        }
    }

    environment {
        IMAGE_NAME = "uzbuzbiz/api-backend"
        HELM_RELEASE_NAME = "api-release"
    }

    stages {
        stage('Build & Push with Kaniko') {
            steps {
                container('kaniko') {
                    // Usamos las credenciales de Jenkins 'docker-hub-creds'
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', 
                                                    usernameVariable: 'DOCKER_USER', 
                                                    passwordVariable: 'DOCKER_PASS')]) {
                        script {
                            // Generamos el config.json de Docker al vuelo para que Kaniko pueda hacer el push
                            sh """
                            echo "{\\\"auths\\\":{\\\"https://index.docker.io/v1/\\\":{\\\"auth\\\":\\\"\$(echo -n \${DOCKER_USER}:\${DOCKER_PASS} | base64)\\\"}}}" > /kaniko/.docker/config.json
                            
                            /kaniko/executor --context `pwd` \
                                --dockerfile `pwd`/Dockerfile \
                                --destination ${IMAGE_NAME}:${env.BUILD_ID} \
                                --destination ${IMAGE_NAME}:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy with Helm') {
            steps {
                container('helm') {
                    script {
                        // Desplegamos usando el chart de la carpeta /helm
                        // El tag de la imagen coincide con el ID de construcción de Jenkins
                        sh """
                        helm upgrade --install ${HELM_RELEASE_NAME} ./helm \
                            --set image.tag=${env.BUILD_ID} \
                            --wait
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Despliegue exitoso en api.uzbuzbiz.es"
        }
        failure {
            echo "El pipeline ha fallado. Revisa los logs de la consola."
        }
    }
}