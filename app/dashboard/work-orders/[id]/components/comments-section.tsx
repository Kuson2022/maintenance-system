// app/dashboard/work-orders/[id]/components/comments-section.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { MessageCircle, Trash2, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderDetail } from "@/lib/api/work-orders/types";
import {
  addCommentAction,
  deleteCommentAction,
} from "@/app/actions/work-orders";

const commentSchema = z.object({
  comment: z.string().min(1, "กรุณากรอกความคิดเห็น").max(1000),
});

interface CommentsSectionProps {
  workOrder: WorkOrderDetail;
  currentUserId: string;
}

export function CommentsSection({
  workOrder,
  currentUserId,
}: CommentsSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof commentSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await addCommentAction({
        workOrderId: workOrder.id,
        comment: values.comment,
      });

      if (result.success) {
        toast({
          title: "เพิ่มความคิดเห็นสำเร็จ",
        });
        form.reset();
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถเพิ่มความคิดเห็นได้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCommentId) return;

    setIsDeleting(true);
    try {
      const result = await deleteCommentAction(deleteCommentId);

      if (result.success) {
        toast({
          title: "ลบสำเร็จ",
          description: "ลบความคิดเห็นเรียบร้อยแล้ว",
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถลบได้",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteCommentId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "d MMM yyyy, HH:mm น.", { locale: th });
  };

  const comments = workOrder.comments || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            ความคิดเห็น
            <Badge variant="secondary">{comments.length}</Badge>
          </CardTitle>
          <CardDescription>
            แลกเปลี่ยนความคิดเห็นเกี่ยวกับงานซ่อม
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Comment Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <Textarea
              placeholder="เพิ่มความคิดเห็น..."
              rows={3}
              {...form.register("comment")}
              disabled={isSubmitting}
            />
            {form.formState.errors.comment && (
              <p className="text-sm text-destructive">
                {form.formState.errors.comment.message}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} size="sm">
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
              </Button>
            </div>
          </form>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => {
                const canDelete =
                  comment.user.id === currentUserId ||
                  comment.user.role === "ADMIN";

                return (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-4 bg-muted/50 rounded-lg"
                  >
                    <Avatar className="shrink-0">
                      <AvatarImage src={comment.user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {getInitials(comment.user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">
                            {comment.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>

                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteCommentId(comment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <p className="text-sm whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">ยังไม่มีความคิดเห็น</p>
              <p className="text-xs">เป็นคนแรกที่แสดงความคิดเห็น</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteCommentId !== null}
        onOpenChange={(open) => !open && setDeleteCommentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบความคิดเห็นนี้?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}