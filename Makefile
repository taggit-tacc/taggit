TAG := $(shell git log --format=%h -1)
IMAGE ?= taccwma/taggit

.PHONY: image
build:
	docker build -t $(IMAGE):$(TAG) -f Dockerfile .
	docker tag $(IMAGE):$(TAG) $(IMAGE):latest

.PHONY: deploy
deploy:
	docker push $(IMAGE):$(TAG)

.PHONY: deploy-latest
deploy-latest:
	docker push $(IMAGE):latest
