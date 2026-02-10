import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import styles
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OptInManager() {
  const { request, loading } = useApi<any>();
  const { toast } = useToast();

  const [optIns, setOptIns] = useState<any[]>([]);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // --- FETCH DATA ---
  const fetchOptIns = async () => {
    // Assuming GET /api/admin/templates exists from previous backend step
    const res = await request("/admin/templates", "GET"); 
    if (res) { // Adjust based on your actual API response wrapper
      setOptIns(Array.isArray(res) ? res : res.data || []);
    }
  };

  useEffect(() => {
    fetchOptIns();
  }, []);

  // --- HANDLERS ---
  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content); // Load HTML into Quill
    setIsActive(item.is_active === 1 || item.is_active === true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      toast({ title: "Error", description: "Title and Content are required", variant: "destructive" });
      return;
    }

    const payload = { title, content, is_active: isActive };
    
    let res;
    if (editingId) {
        // Update
        res = await request(`/admin/templates/${editingId}`, "PUT", payload);
    } else {
        // Create
        res = await request("/admin/templates", "POST", payload);
    }

    if (res) {
        toast({ title: "Success", description: "Opt-In saved successfully" });
        setIsDialogOpen(false);
        fetchOptIns();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await request(`/admin/templates/${deleteId}`, "DELETE");
    if (res) {
      toast({ title: "Deleted", description: "Opt-In removed" });
      fetchOptIns();
    }
    setDeleteId(null);
  };

  return (
    <div className="flex h-screen bg-background relative z-0">
      <DashboardSidebar />

      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Email Opt-In Library</h2>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Create New
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Internal Title</TableHead>
                  <TableHead>Preview Content</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optIns.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                            No opt-ins created yet.
                        </TableCell>
                    </TableRow>
                ) : (
                    optIns.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell className="text-muted-foreground text-sm truncate max-w-[400px]">
                            {/* Strip HTML tags for preview */}
                            <div dangerouslySetInnerHTML={{ __html: item.content }} className="line-clamp-1" />
                        </TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </TableCell>
                        <TableCell className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog open={deleteId === item.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Opt-In?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will remove it from the library. Existing events using this may be affected.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Opt-In" : "Create New Opt-In"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Internal Title (Admin Only)</Label>
              <Input 
                id="title" 
                placeholder="e.g. GDPR Marketing Consent" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div className="grid gap-2">
              <Label>Consent Text (Displayed to User)</Label>
              <div className="h-[200px] mb-12">
                <ReactQuill 
                    theme="snow" 
                    value={content} 
                    onChange={setContent} 
                    style={{ height: '150px' }}
                    modules={{
                        toolbar: [
                          ['bold', 'italic', 'underline'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link']
                        ],
                      }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4">
                <Switch checked={isActive} onCheckedChange={setIsActive} id="active-mode" />
                <Label htmlFor="active-mode">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}