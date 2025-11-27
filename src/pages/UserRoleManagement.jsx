import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Shield, Users, Check, Eye, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { usePermissions, ROLE_PERMISSIONS } from "@/components/auth/PermissionsContext";
import ProtectedModule from "@/components/auth/ProtectedModule";

const ROLES = ["Admin", "Sales Manager", "Inventory Clerk", "Logistics Coordinator"];

const roleColors = {
  "Admin": "bg-red-100 text-red-800",
  "Sales Manager": "bg-blue-100 text-blue-800",
  "Inventory Clerk": "bg-green-100 text-green-800",
  "Logistics Coordinator": "bg-purple-100 text-purple-800"
};

export default function UserRoleManagement() {
  const [selectedRole, setSelectedRole] = useState(null);
  const queryClient = useQueryClient();
  const { isAdmin } = usePermissions();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => base44.entities.User.list()
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.entities.User.update(userId, { custom_role: role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      toast.success("User role updated");
    },
    onError: () => {
      toast.error("Failed to update role");
    }
  });

  const handleRoleChange = (userId, role) => {
    updateRoleMutation.mutate({ userId, role });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedModule module="Dashboard">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Role Management</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>

        {/* Role Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map(role => {
            const count = users.filter(u => 
              (u.role === "admin" && role === "Admin") || 
              (u.custom_role === role && u.role !== "admin")
            ).length;
            return (
              <Card 
                key={role} 
                className={`cursor-pointer transition-all ${selectedRole === role ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedRole(selectedRole === role ? null : role)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className={roleColors[role]}>{role}</Badge>
                      <p className="text-2xl font-bold mt-2">{count}</p>
                      <p className="text-sm text-muted-foreground">users</p>
                    </div>
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Permissions Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    {ROLES.map(role => (
                      <TableHead key={role} className="text-center">{role}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {["sales", "inventory", "deliveries", "purchase", "production", "finance", "dashboards", "reports"].map(module => (
                    <TableRow key={module}>
                      <TableCell className="font-medium capitalize">{module}</TableCell>
                      {ROLES.map(role => {
                        const perms = ROLE_PERMISSIONS[role]?.actions[module] || [];
                        return (
                          <TableCell key={role} className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {perms.includes("view") && (
                                <Badge variant="outline" className="text-xs"><Eye className="h-3 w-3" /></Badge>
                              )}
                              {perms.includes("create") && (
                                <Badge variant="outline" className="text-xs"><Plus className="h-3 w-3" /></Badge>
                              )}
                              {perms.includes("edit") && (
                                <Badge variant="outline" className="text-xs"><Edit className="h-3 w-3" /></Badge>
                              )}
                              {perms.includes("delete") && (
                                <Badge variant="outline" className="text-xs"><Trash2 className="h-3 w-3" /></Badge>
                              )}
                              {perms.length === 0 && <span className="text-muted-foreground">-</span>}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Users
              {selectedRole && <Badge className={roleColors[selectedRole]}>Filtered: {selectedRole}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {isAdmin() && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter(u => !selectedRole || 
                    (u.role === "admin" && selectedRole === "Admin") || 
                    (u.custom_role === selectedRole && u.role !== "admin")
                  )
                  .map(user => {
                    const effectiveRole = user.role === "admin" ? "Admin" : (user.custom_role || "Sales Manager");
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[effectiveRole]}>{effectiveRole}</Badge>
                        </TableCell>
                        {isAdmin() && (
                          <TableCell>
                            {user.role !== "admin" && (
                              <Select
                                value={user.custom_role || "Sales Manager"}
                                onValueChange={(value) => handleRoleChange(user.id, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.filter(r => r !== "Admin").map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {user.role === "admin" && (
                              <span className="text-sm text-muted-foreground">System Admin</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedModule>
  );
}