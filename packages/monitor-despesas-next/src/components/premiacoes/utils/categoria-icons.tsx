
import React from 'react'
import { Fuel, Users, Megaphone, Plane, Utensils, Building, Car, Mail, Phone, Award, Zap, Wrench, Briefcase, FileText, MapPin, Truck, CreditCard, Wifi, Monitor, Shield, Palette, Camera, Clock, HardDrive, Globe } from 'lucide-react'

export const getCategoriaIcon = (categoria: string, className?: string) => {
  const categoriaUpper = categoria.toUpperCase()
  const iconClassName = className || "h-5 w-5"
  
  if (categoriaUpper.includes('COMBUSTÍVEL') || categoriaUpper.includes('LUBRIFICANTE')) {
    return Fuel
  }
  
  if (categoriaUpper.includes('CONSULTORIA') || categoriaUpper.includes('TRABALHOS TÉCNICOS')) {
    return Users
  }
  
  if (categoriaUpper.includes('DIVULGAÇÃO') || categoriaUpper.includes('ATIVIDADE PARLAMENTAR')) {
    return Megaphone
  }
  
  if (categoriaUpper.includes('BILHETE AÉREO') || categoriaUpper.includes('PASSAGENS AÉREAS') || categoriaUpper.includes('AERONAVES')) {
    return Plane
  }
  
  if (categoriaUpper.includes('ALIMENTAÇÃO')) {
    return Utensils
  }
  
  if (categoriaUpper.includes('HOSPEDAGEM')) {
    return Building
  }
  
  if (categoriaUpper.includes('VEÍCULOS') && categoriaUpper.includes('TERRESTRES')) {
    return Car
  }
  
  if (categoriaUpper.includes('POSTAIS')) {
    return Mail
  }
  
  if (categoriaUpper.includes('TELEFONIA') || categoriaUpper.includes('TELEFONE')) {
    return Phone
  }
  
  if (categoriaUpper.includes('ENERGIA') || categoriaUpper.includes('ELÉTRICA') || categoriaUpper.includes('GÁS')) {
    return Zap
  }
  
  if (categoriaUpper.includes('EQUIPAMENTOS') || categoriaUpper.includes('MATERIAL PERMANENTE')) {
    return HardDrive
  }
  
  if (categoriaUpper.includes('MANUTENÇÃO') || categoriaUpper.includes('CONSERVAÇÃO')) {
    return Wrench
  }
  
  if (categoriaUpper.includes('SEGURANÇA')) {
    return Shield
  }
  
  if (categoriaUpper.includes('ESCRITÓRIO') || categoriaUpper.includes('MATERIAL DE CONSUMO')) {
    return FileText
  }
  
  if (categoriaUpper.includes('LOCAÇÃO') && categoriaUpper.includes('VEÍCULOS')) {
    return Truck
  }
  
  if (categoriaUpper.includes('GRÁFICOS') || categoriaUpper.includes('IMPRESSÃO')) {
    return Palette
  }
  
  if (categoriaUpper.includes('TAXI') || categoriaUpper.includes('PEDÁGIO') || categoriaUpper.includes('ESTACIONAMENTO')) {
    return MapPin
  }
  
  if (categoriaUpper.includes('ASSINATURA') || categoriaUpper.includes('PUBLICAÇÕES')) {
    return Globe
  }
  
  if (categoriaUpper.includes('INFORMÁTICA') || categoriaUpper.includes('SOFTWARE') || categoriaUpper.includes('INTERNET')) {
    return Monitor
  }
  
  if (categoriaUpper.includes('CURSOS') || categoriaUpper.includes('EVENTOS') || categoriaUpper.includes('PARTICIPAÇÃO')) {
    return Briefcase
  }
  
  return Award
}

export const getCategoriaIconJSX = (categoria: string, className?: string) => {
  const IconComponent = getCategoriaIcon(categoria)
  const iconClassName = className || "h-5 w-5"
  return <IconComponent className={iconClassName} />
}