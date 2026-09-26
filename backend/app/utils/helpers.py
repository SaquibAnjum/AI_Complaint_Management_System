"""API helper functions for consistent JSON responses and utility methods."""

from flask import jsonify


def api_response(success=True, message="", data=None, error=None, pagination=None, status_code=200):
    """Generate standardized API JSON response."""
    payload = {
        "success": success,
        "message": message,
    }

    if success:
        if data is not None:
            payload["data"] = data
        if pagination is not None:
            payload["pagination"] = pagination
    else:
        if error is not None:
            payload["error"] = error
        if data is not None:
            payload["data"] = data

    return jsonify(payload), status_code
