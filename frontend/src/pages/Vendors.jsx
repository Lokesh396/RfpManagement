import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import SkeltonTable from "./SkeltonTable";
import vendorsData from "@/data/vendors.json";

function Vendors() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Simulate load delay (you can remove setTimeout if not needed)
    const t = setTimeout(() => {
      setUsers(vendorsData);
      setIsLoading(false);
    }, 300); // small delay to show skeleton

    return () => clearTimeout(t);
  }, []);

  // filter by name, email, role, or project
  const filtered = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter((u) => {
      if (!u) return false;
      if ((u.name || "").toLowerCase().includes(q)) return true;
      if ((u.email || "").toLowerCase().includes(q)) return true;
      if ((u.role || "").toLowerCase().includes(q)) return true;
      if (u.projects?.some((p) => (p.name || "").toLowerCase().includes(q)))
        return true;
      return false;
    });
  }, [users, query]);

  return (
    <>
      <div className="relative p-3 w-full">
        <div className="flex justify-center gap-3 mb-4">
          <Input
            placeholder="Search vendors by name, email, role or project..."
            className="w-80 md:min-w-[600px] md:h-14"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <section>

          <Table>
            <TableCaption>A list of your vendors (static data).</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Id</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Projects</TableHead>
              </TableRow>
            </TableHeader>

            {isLoading ? (
              <SkeltonTable colspan={5} />
            ) : (
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center">
                      <div className="text-sm text-muted-foreground">
                        No vendors match your search.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          {user.phone && (
                            <span className="text-xs text-muted-foreground">
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${user.email}`}
                          className="text-sm underline hover:no-underline"
                        >
                          {user.email}
                        </a>
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="flex gap-2">
                        {user.projects?.map((project, index) => (
                          <Badge variant="outline" key={index}>
                            {project.name}
                          </Badge>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </section>

        <span className="absolute top-1 left-1 h-6 w-6">
          <SidebarTrigger />
        </span>
      </div>
    </>
  );
}

export default Vendors;
