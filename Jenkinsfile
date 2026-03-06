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
      - name: kaniko-cache
        mountPath: /cache
  - name: helm
    image: alpine/helm:latest
    command: ["/bin/sh", "-c"]
    args: ["tail -f /dev/null"]
  volumes:
    - name: kaniko-secret
      emptyDir: {}
    - name: kaniko-cache
      persistentVolumeClaim:
        claimName: kaniko-cache-pvc
'''
        }
    }

    environment {
        IMAGE_NAME = "uzbuzbiz/api-backend"
        HELM_RELEASE_NAME = "api-release"
        NAMESPACE = "jenkins"
    }

    stages {
        stage('Build & Push with Kaniko') {
            steps {
                container('kaniko') {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', 
                                                    usernameVariable: 'DOCKER_USER', 
                                                    passwordVariable: 'DOCKER_PASS')]) {
                        script {
                            // Generación de config.json más limpia
                            sh """
                            echo "{\\\"auths\\\":{\\\"https://index.docker.io/v1/\\\":{\\\"auth\\\":\\\"\$(echo -n \${DOCKER_USER}:\${DOCKER_PASS} | base64)\\\"}}}" > /kaniko/.docker/config.json
                            
                            /kaniko/executor --context ${WORKSPACE} \
                                --dockerfile ${WORKSPACE}/Dockerfile \
                                --destination ${IMAGE_NAME}:${env.BUILD_ID} \
                                --destination ${IMAGE_NAME}:latest \
                                --cache=false \
                                --cache-dir=/cache \
                                --snapshot-mode=redo \
                                --use-new-run
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
                        // Añadimos el flag --create-namespace y el uso de la variable NAMESPACE
                        sh """
                        helm upgrade --install ${HELM_RELEASE_NAME} ./helm \
                            --namespace ${env.NAMESPACE} \
                            --create-namespace \
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
            echo "Despliegue exitoso en api.uzbuzbiz.es (Namespace: ${env.NAMESPACE})"
        }
        failure {
            echo "El pipeline ha fallado. Revisa los logs de Kaniko o Helm."
        }
    }
}