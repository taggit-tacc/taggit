# Kubernetes + Deployment

## Images building + Jenkins

The deployment of images and updating of the Kubernetes services and applications is performed by a Jenkins
workflow found [here](https://jenkins01.tacc.utexas.edu/view/Hazmapper+Geoapi/.)

The images used in deployment are built automatically for the master branch using TravisCI and 
pushed to Docker Hub (see https://hub.docker.com/r/taccwma/taggit).

### Kube config

[`taggit.kube.yaml`](taggit.kube.yaml) describes the configuration of the cluster. The file is adjusted using `envsubstr` to provide
custom values for the image tags and node portfor the production or staging environments.

## Additional Information/Tips

For additional information like access and troubleshooting see [geoapi's kube README](https://github.com/TACC-Cloud/geoapi/tree/master/kube/README.md).
