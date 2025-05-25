import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Users, Heart } from "lucide-react";

export function ContactInfo() {
  const contactDetails = [
    {
      icon: Mail,
      title: "Email",
      content: "info@siagamalaria.id",
      description: "Send us an email for general inquiries",
    },
    {
      icon: Phone,
      title: "Phone",
      content: "+62 21 1234 5678",
      description: "Call us during business hours",
    },
    {
      icon: MapPin,
      title: "Location",
      content: "Jakarta, Indonesia",
      description: "Serving healthcare facilities across Indonesia",
    },
    {
      icon: Clock,
      title: "Support Hours",
      content: "24/7 Emergency Support",
      description: "Mon-Fri 9AM-6PM for general inquiries",
    },
  ];

  const teamInfo = [
    {
      title: "For Healthcare Providers",
      description:
        "Get technical support, training, and implementation assistance for integrating our malaria detection system into your healthcare facility.",
    },
    {
      title: "For Researchers",
      description:
        "Interested in collaborating on malaria research or accessing our datasets? We welcome partnerships with academic institutions.",
    },
    {
      title: "For Developers",
      description:
        "Want to contribute to our open-source project or integrate our API? Connect with our development team.",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            Get in Touch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {contactDetails.map((detail, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <detail.icon className="h-5 w-5 text-green-600 mt-1" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{detail.title}</h3>
                <p className="text-green-600 font-medium">{detail.content}</p>
                <p className="text-sm text-gray-500">{detail.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Who We Serve
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamInfo.map((info, index) => (
            <div key={index} className="border-l-4 border-green-200 pl-4">
              <h3 className="font-medium text-gray-900 mb-1">{info.title}</h3>
              <p className="text-sm text-gray-600">{info.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-800 mb-2">Our Mission</h3>
              <p className="text-sm text-green-700">
                We committed to improving malaria diagnosis and treatment in
                Indonesia, especially in remote areas where access to
                traditional laboratory facilities is limited. Our AI-powered
                detection system aims to save lives through early and accurate
                diagnosis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
