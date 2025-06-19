import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Linkedin, BookOpen, Github, Mail } from "lucide-react"
import Image from "next/image"

const teamMembers = [
    {
      name: "Prof. Vimal Mishra",
      title: "Professor, Civil Engineering, IIT Gandhinagar",
      description:
        "Advisor",
      image: "/Vimal Mishra.a1d42ea96aa0546a5fd5.jpg",
      linkedin: "#",
      scholar: "#",
      github: "#",
      email: "vimal.mishra@iitgn.ac.in",
    },
    {
      name: "Hiren Solanki",
      title: "PhD Research Scholar",
      description: "Machine Learning, Deep Learning, Hydroclimatic extremes, Remote Sensing, Paleoclimate",
      image:"/Hiren Solanki.6de65781a4ed43991632.jpg",
      linkedin: "https://www.linkedin.com/in/hiren-solanki-831286135 ",
      scholar: "#",
      github: "#",
      email: "hiren.solanki@iitgn.ac.in",
    },
    {
      name: "Aravinthakshan",
      title: "B.Tech CSE Student, Manipal Institute of Technology",
      description: "AI Researcher, Software and Machine Learning Engineer",
      image: "/aravinthakshan.jpg",
      linkedin: "https://www.linkedin.com/in/aravinthakshan/",
      github: "github.com/aravinthakshan/",
      email: "aravinthakshanmain@gmail.com",
    },
    {
      name: "Sayuj Gupta",
      title: "B.Tech CSE Student, IIT Jammu",
      description: "AI Researcher, Software and Machine Learning Engineer",
      image: "/sayuj.png",
      linkedin: "https://www.linkedin.com/in/sayuj-gupta-14a4b42b9 ",
      email: "sayuj.gupta@iitgn.ac.in",
    },
  ]
  
  export default function AboutPage() {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 p-4 md:p-8 pt-6">
          <div className="max-w-8xl mx-auto space-y-8">
            {/* Header Section */}

              {/* Lab Description */}
              <Card className="border-none shadow-none">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-semibold">Water and Climate Lab</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                    The Water and Climate Lab at IIT Gandhinagar focuses on understanding the complex interactions between
                    water resources and climate systems. Our interdisciplinary research combines advanced modeling
                    techniques, remote sensing technologies, and machine learning approaches to address critical
                    challenges in water security, climate adaptation, and environmental sustainability.
                  </p>
                  <p className="text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                    Through collaborative research and innovative methodologies, we aim to contribute to evidence-based
                    solutions for water management, climate resilience, and sustainable development in the face of
                    changing environmental conditions.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center pt-2 gap-2">
                    <Button asChild size="lg" className="text-base font-semibold px-8 py-2">
                      <a href="/maps">Explore Maps</a>
                    </Button>
                    <Button asChild size="lg" className="text-base font-semibold px-8 py-2" variant="secondary">
                      <a href="/case-study">Case Study</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Our Team</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {teamMembers.map((member, index) => (
                  <Card key={index} className="overflow-hidden shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center gap-2">
                        {/* Profile Image */}
                        <div className="w-40 h-40 rounded-full overflow-hidden bg-muted">
                          <Image
                            src={member.image || "/placeholder.svg"}
                            alt={member.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Name and Title */}
                        <div className="space-y-0.5">
                          <h3 className="text-xl font-semibold">{member.name}</h3>
                          <p className="text-l font-medium text-primary">{member.title}</p>
                        </div>
                        {/* Research Interests */}
                        <div className="space-y-0.5">
                          <p className="text-s text-muted-foreground leading-snug">{member.description}</p>
                        </div>
                        {/* Social Links */}
                        <div className="flex gap-1 pt-1">
                          <Button variant="outline" size="icon" asChild>
                            <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                            <a href={member.scholar} target="_blank" rel="noopener noreferrer">
                              <BookOpen className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                            <a href={member.github} target="_blank" rel="noopener noreferrer">
                              <Github className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                            <a href={`mailto:${member.email}`}> 
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
  
          </div>
        </div>
      </div>
    )
  
} 