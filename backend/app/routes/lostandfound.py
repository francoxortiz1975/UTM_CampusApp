from flask import Blueprint, request, session
from ..components.lostandfound import LostAndFound, Comments
from ..components.statusreport import StatusCode, StatusReport

lostandfound_bp = Blueprint("lostandfound", __name__)

@lostandfound_bp.route("/", methods=["POST"], strict_slashes=False)
def create_item():
    """
    POST /reports/
    Body: { "item": "...", "desc": "..." }
    """
    data = request.json or {}
    LostAndFound.delete_older_than_week()

    user_id = session.get("user_id")
    item = data.get("item")
    desc = data.get("desc")

    if not user_id:
        status = StatusReport(
            "You must be logged in to submit a lost item",
            StatusCode.UNAUTHORIZED
        )
        return status.json(), status.code()

    if not item:
        status = StatusReport("item is required", StatusCode.BAD_REQUEST)
        return status.json(), status.code()

    if not desc:
        status = StatusReport("desc is required", StatusCode.BAD_REQUEST)
        return status.json(), status.code()

    laf = LostAndFound(user_id=user_id, item=item, desc=desc)
    laf.save()

    status = StatusReport(laf.to_dict(), StatusCode.CREATED)
    return status.json(), status.code()


@lostandfound_bp.route("/", methods=["GET"])
def get_all():
    entries = LostAndFound.get_all()
    if entries:
        all_entries = [entry.to_dict() for entry in entries]
    else:
        all_entries = []

    status = StatusReport(all_entries, StatusCode.OK)
    return status.json(), status.code()

@lostandfound_bp.route("/delete/<int:id>", methods=["GET"])
def delete_post(id):
        
    if not id:
        status = StatusReport(
            "An id is required",
            StatusCode.BAD_REQUEST
        )
        return status.json(), status.code()

    deleted = LostAndFound.delete_by_id(id)
    
    if not deleted:
        status = StatusReport("No matching id", StatusCode.BAD_REQUEST)
        return status.json(), status.code()
    
    all_comments = Comments.get_all_by_post_id(id)
    for comment in all_comments:
        if not Comments.delete_by_id(comment.id):
            print("BOOOO")
    
    status = StatusReport("Deleted", StatusCode.OK)
    return status.json(), status.code()

@lostandfound_bp.route("/update", methods=["POST"], strict_slashes=False)
def update_post():
    """
    POST /reports/update
    Body: { "id": "...", "item": "...", "desc": "..."}
    """

    data = request.json or {}
    id = data.get("id")
    item = data.get("item")
    desc = data.get("desc")

    if not id:
        status = StatusReport(
            "An id is required",
            StatusCode.BAD_REQUEST
        )
        return status.json(), status.code()
    
    if not item:
        status = StatusReport("item is required", StatusCode.BAD_REQUEST)
        return status.json(), status.code()

    if not desc:
        status = StatusReport("desc is required", StatusCode.BAD_REQUEST)
        return status.json(), status.code()
    
    update = LostAndFound.update_by_id(entry_id=id, desc=desc, item=item)
    if not update:
        status = StatusReport("No matching id", StatusCode.BAD_REQUEST)
        return status.json(), status.code()
    
    status = StatusReport(update.to_dict(), StatusCode.OK)
    return status.json(), status.code()

@lostandfound_bp.route("/<int:post_id>/comment", methods=["POST"], strict_slashes=False)
def new_comment(post_id):
    data = request.json or {}
    
    user_id = session.get("user_id")
    comment = data.get("comment")
    
    if not user_id:
        status = StatusReport(
            "You must be logged in to submit a lost item",
            StatusCode.UNAUTHORIZED
        )
        return status.json(), status.code()

    if not comment:
        status = StatusReport("No comment provided", StatusCode.BAD_REQUEST)
        return status.json(), status.code()
    
    n_comment = Comments(user_id=user_id, post_id=post_id, comment=comment)
    n_comment.save()

    status = StatusReport(n_comment.to_dict(), StatusCode.CREATED)
    return status.json(), status.code()

@lostandfound_bp.route("/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    comments = Comments.get_all_by_post_id(post_id)
    if comments:
        all_entries = [entry.to_dict() for entry in comments]
    else:
        all_entries = []

    status = StatusReport(all_entries, StatusCode.OK)
    return status.json(), status.code()