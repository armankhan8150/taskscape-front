import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeamMember } from "@/types/task";
import { Users, UserPlus } from "lucide-react";

interface TeamSidebarProps {
  members: TeamMember[];
  selectedMember: string | null;
  onMemberSelect: (memberId: string | null) => void;
}

export function TeamSidebar({ members, selectedMember, onMemberSelect }: TeamSidebarProps) {
  return (
    <aside className="w-64 border-r bg-card/50 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Team</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant={selectedMember === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onMemberSelect(null)}
        >
          All Members
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {members.map((member) => (
            <Button
              key={member.id}
              variant={selectedMember === member.id ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 h-auto py-2"
              onClick={() => onMemberSelect(member.id)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium truncate w-full text-left">
                  {member.name}
                </span>
                <span className="text-xs text-muted-foreground truncate w-full text-left">
                  {member.role}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
