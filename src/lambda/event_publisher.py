from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.utilities.data_classes import event_source
from aws_lambda_powertools.utilities.data_classes.api_gateway_authorizer_event import (
    APIGatewayAuthorizerRequestEvent,
)
import os
import json
from pathlib import Path


tracer = Tracer()
logger = Logger()
app = APIGatewayRestResolver()


@app.get("/pets")
@tracer.capture_method
def get_pets():
    return {"pets": []}


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def handler(event: dict, context: LambdaContext) -> dict:
    logger.info(f"Handler started...")

    # Retrieve the environment variable
    metaflow_config_str = os.getenv("METAFLOW_CONFIG_STR")
    if not metaflow_config_str:
        logger.error("METAFLOW_CONFIG_STR not set.")
        return {"statusCode": 500, "body": "METAFLOW_CONFIG_STR environment variable is not set."}

    try:
        # Define the path for the metaflow config file
        metaflow_config_path = Path("/tmp/.metaflowconfig/config.json")
        os.environ['METAFLOW_HOME'] = "/tmp/.metaflowconfig"

        # Ensure the directory exists
        metaflow_config_path.parent.mkdir(parents=True, exist_ok=True)

        # Write the config string to the file
        with metaflow_config_path.open("w") as f:
            json.dump(json.loads(metaflow_config_str), f, indent=2)

        logger.info(f"Metaflow config written to {metaflow_config_path}")

    except Exception as e:
        logger.error(f"Failed to write Metaflow config: {str(e)}")
        return {
            "statusCode": 500,
            "body": f"Failed to write Metaflow config with the following exception:\n\n{str(e)}",
        }

    from metaflow.integrations import ArgoEvent
    from metaflow.metaflow_config import (
        ARGO_EVENTS_WEBHOOK_AUTH,
        ARGO_EVENTS_WEBHOOK_URL,
        SERVICE_HEADERS,
    )

    logger.info(f"Argo event webhook URL: {ARGO_EVENTS_WEBHOOK_URL}")
    logger.info(f"Argo event webhook auth: {ARGO_EVENTS_WEBHOOK_AUTH}")

    # Use the Metaflow configuration
    event_name = os.getenv("METAFLOW_EVENT_NAME")
    if not event_name:
        logger.error("METAFLOW_EVENT_NAME not set.")
        return {"statusCode": 500, "body": "METAFLOW_EVENT_NAME not set."}

    try:
        logger.info(f"Attempting to publish event {event_name}.")
        ArgoEvent(name=event_name).publish(
            payload = {
                "context": json.dumps({
                    "request_id": context.aws_request_id,
                    "function_name": context.function_name,
                    "function_version": context.function_version,
                    "log_stream_name": context.log_stream_name,
                })
            }
        )

        logger.info(f"Event {event_name} successful.")
        return {"statusCode": 200, "body": f"Event {event_name} published successfully."}
    except Exception as e:
        logger.error(f"ERROR publishing event {event_name}.")
        return {"statusCode": 500, "body": f"Failed to publish event with the following exception:\n\n{str(e)}"}