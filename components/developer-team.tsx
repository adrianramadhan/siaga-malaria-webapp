import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  description: string;
  imageUrl?: string;
}

export function DeveloperTeam() {
  // Team members data - replace with your actual team information
  const teamMembers: TeamMember[] = [
    {
      name: "Naila Suqya",
      role: "Project Lead",
      description:
        "Responsible for project management, and creating web mockups using Figma.",
      imageUrl: "/image/naila.jpeg",
    },
    {
      name: "Brian Aji Pamungkas",
      role: "Machine Learning Engineer",
      description:
        "Designs, trains, and optimizes the CNN model for accurate malaria detection on blood-smear images.",
      imageUrl: "/image/brian.png",
    },
    {
      name: "Adrian Ramadhan",
      role: "Software Engineer",
      description:
        "Implements server-side logic, and integrates the ML model into the web application.",
      imageUrl: "/pp.jpg",
    },
    {
      name: "Fitri Mauizah",
      role: "Data Scientist / Researcher",
      description:
        "Conducts data preprocessing, exploratory analysis, and validation of model performance metrics.",
      imageUrl: "/image/fitri.jpg",
    },
  ];

  return (
    <div className="bg-white border rounded-lg p-6 mb-6 lg:mx-12" id="team">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-bold">Development Team</h2>
        </div>
        <p className="text-gray-600">
          Meet the talented team behind Siaga Malaria Nusantara, dedicated to
          improving malaria detection in Indonesia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teamMembers.map((member, index) => (
          <Card
            key={index}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-square relative bg-gray-100">
              <Avatar className="h-full w-full rounded-none">
                <AvatarImage
                  src={member.imageUrl || "/placeholder.svg"}
                  alt={member.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl h-full w-full rounded-none">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{member.name}</h3>
              <p className="text-sm text-green-600 mb-2">{member.role}</p>
              <p className="text-sm text-gray-600">{member.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
