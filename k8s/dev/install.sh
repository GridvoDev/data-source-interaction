#!/bin/bash
kubectl -n gridvo get svc | grep -q data-source-interaction
if [ "$?" == "1" ];then
	kubectl create -f data_source_interaction-service.yaml --record
	kubectl -n gridvo get svc | grep -q data-source-interaction
	if [ "$?" == "0" ];then
		echo "data_source_interaction-service install success!"
	else
		echo "data_source_interaction-service install fail!"
	fi
else
	echo "data_source_interaction-service is exist!"
fi
kubectl -n gridvo get pods | grep -q data-source-interaction
if [ "$?" == "1" ];then
	kubectl create -f data_source_interaction-deployment.yaml --record
	kubectl -n gridvo get pods | grep -q data-source-interaction
	if [ "$?" == "0" ];then
		echo "data_source_interaction-deployment install success!"
	else
		echo "data_source_interaction-deployment install fail!"
	fi
else
	kubectl delete -f data_source_interaction-deployment.yaml
	kubectl -n gridvo get pods | grep -q data-source-interaction
	while ( "$?" == "0" )
	do
	kubectl -n gridvo get pods | grep -q data-source-interaction
	done
	kubectl create -f data_source_interaction-deployment.yaml --record
	kubectl -n gridvo get pods | grep -q data-source-interaction
	if [ "$?" == "0" ];then
		echo "data_source_interaction-deployment update success!"
	else
		echo "data_source_interaction-deployment update fail!"
	fi
fi
