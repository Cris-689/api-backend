# Documentación y Referencia: API Backend

Este repositorio contiene el código de nuestra API desarrollada en NestJS y toda la configuración de Helm necesaria para desplegarla en nuestro VPS utilizando MicroK8s.

El objetivo de este documento es recordar cómo está configurado el proyecto, las decisiones de infraestructura que se tomaron y los pasos exactos para volver a desplegarlo o actualizarlo.

## Partes Clave de la Infraestructura (Helm)

En lugar de usar archivos de Kubernetes sueltos, gestionamos la infraestructura con un Chart de Helm. Esto nos permite tener plantillas dinámicas y configurar todo desde un único archivo `values.yaml` centralizado en la carpeta `helm/`.

### 1. Estrategia de Despliegue (Rolling Update)

Para garantizar que la web no pierda disponibilidad cuando subimos una nueva versión de la API, hemos configurado una estrategia de actualización progresiva llamada `RollingUpdate` en el Deployment.

¿Cómo funciona exactamente esto?
* **maxSurge: 1**: Le indica a Kubernetes que, al actualizar, primero debe crear un pod adicional con la nueva versión del código.
* **maxUnavailable: 0**: Le prohíbe a Kubernetes eliminar los pods de la versión anterior si eso implica dejar el servicio sin réplicas disponibles.

En resumen: Cuando despliegas, Kubernetes levanta la versión nueva, espera a que esté funcionando correctamente y solo entonces apaga la versión vieja.

### 2. Seguridad del Contenedor

Para mitigar riesgos frente a posibles vulnerabilidades, el pod cuenta con varias restricciones por defecto:
* **Ejecución sin privilegios**: El contenedor se ejecuta con un usuario estándar (`runAsNonRoot: true`, `runAsUser: 1000`), nunca como administrador.
* **Sistema de archivos de solo lectura**: Se ha activado `readOnlyRootFilesystem: true`, lo que significa que ni la propia aplicación ni un atacante pueden escribir archivos o scripts maliciosos en el disco del contenedor.
* **Almacenamiento temporal seguro**: Como la aplicación a veces necesita escribir datos temporales, montamos un volumen vacío específicamente en la carpeta `/tmp` para permitir esa escritura sin comprometer el resto del sistema.

### 3. Restricciones de la API (CORS)

La API está configurada por código para rechazar cualquier petición web que no provenga de nuestro frontend. Solo permite peticiones originadas desde el dominio oficial `https://uzbuzbiz.es`.

## Paso 1: Creación de Secretos en el VPS (Importante)

Para no subir contraseñas al repositorio de GitHub, el Deployment lee las credenciales a través de un secreto en Kubernetes configurado bajo el nombre `backend-db-secrets`.

**Antes de desplegar por primera vez**, debes entrar por SSH a la VPS y ejecutar este comando con MicroK8s para guardar la contraseña de la base de datos y la llave maestra de subidas (`UPLOAD_API_KEY`):

```bash
microk8s kubectl create secret generic backend-db-secrets \
  --from-literal=DB_NAME="<NOMBRE_BD>" \
  --from-literal=DB_USERNAME="<USUARIO_BD>" \
  --from-literal=DB_PASSWORD="<PASS_BD>" \
  --from-literal=UPLOAD_API_KEY="<TU_API_KEY_SECRETA>"

### Análisis Detallado de las Fases del Pipeline

El pipeline de integración y despliegue continuo (CI/CD) se ejecuta íntegramente dentro del clúster de Kubernetes. En lugar de depender de un servidor tradicional con Docker instalado, Jenkins levanta un pod temporal con dos contenedores especializados (`kaniko` para construir y `helm` para desplegar) que se destruyen al finalizar.

A continuación, se detalla el código de cada etapa:

#### Etapa 1: Build & Push (Construcción y Subida)

Esta fase se ejecuta dentro del contenedor de Kaniko. Kaniko es una herramienta de Google que permite construir imágenes de contenedores dentro de Kubernetes sin necesitar acceso root ni el demonio de Docker (DinD), lo cual es una práctica fundamental de seguridad.

```groovy
stage('Build & Push with Kaniko') {
    steps {
        container('kaniko') {
            withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', 
                                              usernameVariable: 'DOCKER_USER', 
                                              passwordVariable: 'DOCKER_PASS')]) {
                script {
                    // 1. Generación de credenciales
                    sh """
                    echo "{\\\"auths\\\":{\\\"[https://index.docker.io/v1/](https://index.docker.io/v1/)\\\":{\\\"auth\\\":\\\"\$(echo -n \${DOCKER_USER}:\${DOCKER_PASS} | base64)\\\"}}}" > /kaniko/.docker/config.json
                    
                    // 2. Ejecución de la construcción
                    /kaniko/executor --context \${WORKSPACE} \
                        --dockerfile \${WORKSPACE}/Dockerfile \
                        --destination \${IMAGE_NAME}:\${env.BUILD_ID} \
                        --destination \${IMAGE_NAME}:latest \
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

Desglose del código:
 * withCredentials: Extrae de forma segura el usuario y contraseña de Docker Hub guardados en Jenkins y los inyecta temporalmente como las variables de entorno DOCKER_USER y DOCKER_PASS.
 * Generación de config.json: Kaniko necesita un archivo de configuración estándar de Docker para poder subir la imagen al registro privado/público. Este comando toma el usuario y contraseña, los codifica en formato Base64 nativamente y crea el archivo en la ruta /kaniko/.docker/config.json.
 * --context y --dockerfile: Le indican a Kaniko dónde están los archivos fuente del proyecto (WORKSPACE) y dónde se ubica el Dockerfile a compilar.
 * --destination: Se define dos veces para aplicar una estrategia de doble etiquetado. Sube la misma imagen etiquetada con el número de ejecución único de Jenkins (BUILD_ID, por ejemplo uzbuzbiz/api-backend:42) y también actualiza la etiqueta latest para que apunte siempre a esta última versión.
 * Optimizaciones de rendimiento (--snapshot-mode=redo y --use-new-run): Modifican la forma en que Kaniko calcula qué archivos han cambiado en el sistema de archivos entre capa y capa del Dockerfile, acelerando significativamente el proceso de construcción.
Etapa 2: Deploy (Despliegue)
Una vez que la imagen está compilada y alojada de forma segura en Docker Hub, el pipeline salta al contenedor de Helm para actualizar la infraestructura.
stage('Deploy with Helm') {
    steps {
        container('helm') {
            script {
                sh """
                helm upgrade --install \${HELM_RELEASE_NAME} ./helm \
                    --namespace \${env.NAMESPACE} \
                    --create-namespace \
                    --set image.tag=\${env.BUILD_ID} \
                    --wait
                """
            }
        }
    }
}

Desglose del código:
 * helm upgrade --install: Es un comando idempotente. Si es la primera vez que se ejecuta el pipeline, instalará toda la arquitectura desde cero. Si la aplicación ya existe, calculará las diferencias y actualizará solo lo necesario.
 * --namespace y --create-namespace: Despliega los recursos en el espacio de nombres definido en las variables de entorno (api-prod). Si este namespace no existe previamente en el clúster de Kubernetes, Helm lo crea sobre la marcha.
 * --set image.tag=\${env.BUILD_ID}: Este es el puente entre la fase 1 y la fase 2. Sobrescribe la versión de la imagen definida en el archivo estático values.yaml obligando a Kubernetes a descargar y usar la imagen exacta que se acaba de construir unos segundos atrás.
 * --wait: Es un control de calidad. Hace que el comando (y por tanto, el pipeline de Jenkins) se quede bloqueado esperando hasta que todos los nuevos Pods de la API estén levantados, saludables y aceptando tráfico. Si la nueva versión tiene un error crítico de código y el contenedor se reinicia, el comando fallará tras un tiempo de espera y el pipeline se marcará en rojo, alertando del problema.

