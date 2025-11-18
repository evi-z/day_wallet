import dataclasses

from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.views import exception_handler


def app_exception_handler(exc, context):
    response = exception_handler(exc, context)
    return response


class SuccessResponse:
    def __new__(
        cls, data=None, json_response=False, status_code: int = 200, *args, **kwargs
    ):
        data = {} if not data else data
        if dataclasses.is_dataclass(data):  # Dataclass -> dict
            data = dataclasses.asdict(data)

        response_model = JsonResponse if json_response else Response

        return response_model(data, status=status_code)
