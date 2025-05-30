
import { useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Comment } from "@/hooks/useComments";
import { format } from "date-fns";

interface CommentsTabProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
}

const CommentsTab = ({ comments, onAddComment }: CommentsTabProps) => {
  const [newComment, setNewComment] = useState("");

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await onAddComment(newComment);
      setNewComment("");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Comments</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <Label htmlFor="newComment">Add Comment</Label>
            <Textarea
              id="newComment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment here..."
              className="min-h-[80px] resize-none text-sm"
            />
            <Button 
              onClick={handleAddComment} 
              className="mt-3 w-full"
              size="sm"
              disabled={!newComment.trim()}
            >
              Add Comment
            </Button>
          </div>
          {comments.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">All Comments ({comments.length}):</p>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                          <span className="font-medium text-xs sm:text-sm text-blue-700">
                            {comment.user_name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(comment.created_at)}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-800 leading-relaxed break-words">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {comments.length === 0 && (
            <div className="text-sm text-gray-400 italic text-center py-8">No comments added yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentsTab;
