TAG := $(shell git log --format=%h -1)
IMAGE ?= taccaci/taggit:$(TAG)

.PHONY: image
image:
	docker build -t $(IMAGE) -f Dockerfile .

.PHONY: deploy
deploy:
	docker push $(IMAGE)
