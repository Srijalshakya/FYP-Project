"use client"

import { motion } from "framer-motion"
import { Dumbbell, Mail, Phone, MapPin, CheckCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { useState } from "react"
import { useToast } from "../ui/use-toast"
import axios from "axios"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const featureItems = [
  {
    icon: <Dumbbell className="h-8 w-8 text-red-600" />,
    title: "Premium Equipment",
    description: "High-quality gym equipment designed for durability and performance.",
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-red-600" />,
    title: "Trusted Quality",
    description: "All products are rigorously tested to ensure safety and reliability.",
  },
  {
    icon: <MapPin className="h-8 w-8 text-red-600" />,
    title: "Nationwide Delivery",
    description: "Fast and reliable delivery to your doorstep, anywhere in the country.",
  },
]

const teamMembers = [
  {
    name: "John Doe",
    role: "Founder & CEO",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    name: "Jane Smith",
    role: "Head of Sales",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    name: "Mike Johnson",
    role: "Product Manager",
    image: "https://randomuser.me/api/portraits/men/3.jpg",
  },
]

function About() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await axios.post("http://localhost:5000/api/shop/contact/send-message", formData)
      if (response.data.success) {
        toast({
          title: "Message Sent!",
          description: "We'll get back to you soon.",
        })
        setFormData({ name: "", email: "", message: "" })
      } else {
        throw new Error(response.data.message || "Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Hero Section */}
      <motion.section
        className="bg-gray-900 text-white py-20"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About FitMart</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Empowering your fitness journey with the best gym equipment since 2020.
          </p>
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section
        className="py-16"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Our Mission</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto text-center">
            At FitMart, our mission is to provide fitness enthusiasts with top-notch gym equipment
            that inspires and supports their journey to a healthier lifestyle. We believe in quality,
            innovation, and accessibility for all.
          </p>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="bg-white py-16"
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose FitMart?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureItems.map((feature, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg shadow-md"
                variants={fadeIn}
              >
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section
        className="py-16"
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        className="bg-gray-900 text-white py-16"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4">
                <p className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-red-600" />
                  <span>fitmart@gmail.com</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-red-600" />
                  <span>+(977) 9847346364</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <span>Naxal, Kathmandu, 44600</span>
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-gray-800 text-white border-red-600/50"
                required
              />
              <Input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-gray-800 text-white border-red-600/50"
                required
              />
              <Textarea
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleInputChange}
                className="bg-gray-800 text-white border-red-600/50"
                required
              />
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default About;