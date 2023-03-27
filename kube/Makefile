SHELL := /bin/bash

help:   ## Show this help.
	@echo ""
	@echo "Possible Commands:"
	@echo ""
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'
	@echo ""

.PHONY: checkforcontext
checkforcontext:
	@if test -z "$(KUBE_CONTEXT)"; then\
		 echo "Missing context";\
		 exit 1;\
	fi
	@echo "Using '$(KUBE_CONTEXT)' context"

.PHONY: checkfortag
checkfortag:
	@if test -z "$(TAGGIT_TAG)"; then\
		 echo "Missing TAGGIT_TAG needed for image";\
		 exit 1;\
	fi
	@echo "Using '$(TAGGIT_TAG)' image"

.PHONY: create
create: checkforcontext checkfortag
	@echo "Creating taggit deployment/services/migration-job in '$(KUBE_CONTEXT)' context"
	source ${ENV_FILE} && cat taggit.kube.yaml | envsubst '$${TAGGIT_TAG} $${TAGGIT_NODEPORT}' | kubectl apply --context $(KUBE_CONTEXT) -f -

.PHONY: delete
delete: checkforcontext
	@echo "Deleting taggit deployment in '$(KUBE_CONTEXT)' context"
	kubectl delete --context $(KUBE_CONTEXT) --ignore-not-found=true deployment taggit 
	kubectl delete --context $(KUBE_CONTEXT) --ignore-not-found=true service taggit

.PHONY: delete-staging
delete-staging: KUBE_CONTEXT=geoapi-dev
delete-staging: delete ## Delete deployment/services/jobs of taggit (STAGING)
	@echo "Finished deleting taggit deployment in '$(KUBE_CONTEXT)' context"

.PHONY: create-staging
create-staging: KUBE_CONTEXT=geoapi-dev
create-staging: ENV_FILE=staging.env
create-staging: create ## Create deployment of taggit (STAGING)
	@echo "Finished creating taggit deployment in '$(KUBE_CONTEXT)' context using ${ENV_FILE} file"

.PHONY: delete-production
delete-production: KUBE_CONTEXT=wma-geospatial
delete-production: delete ## Delete deployment of taggit (PRODUCTION) !!!  CAREFUL !
	@echo "Finished deleting taggit deployment in '$(KUBE_CONTEXT)' context"

.PHONY: delete-staging
create-production: KUBE_CONTEXT=wma-geospatial
create-production: ENV_FILE=prod.env
create-production: create ## Create deployment/services/jobs of taggit (PRODUCTION) !!!  CAREFUL !
	@echo "Finished creating taggit deployment in '$(KUBE_CONTEXT)' context using ${ENV_FILE} file"

