
export type AvatarPreset = {
  label: string;
  iconKey: string;
  description: string;
  background: string;
  radius: string;
  clipPath: string;
};

export const avatarPresets: AvatarPreset[] = [
  { label: "Relámpago Delta", iconKey: "zap", description: "Descarga rápida", background: "linear-gradient(135deg, #ffc712 0%, #fff3a3 100%)", radius: "14px 6px 14px 6px", clipPath: "none" },
  { label: "Centella Alta", iconKey: "sparkles", description: "Energía concentrada", background: "linear-gradient(135deg, #36a3ff 0%, #b794f4 100%)", radius: "999px", clipPath: "none" },
  { label: "Rayo Norte", iconKey: "bolt", description: "Precisión eléctrica", background: "linear-gradient(135deg, #f8fafc 0%, #ffd95a 100%)", radius: "8px 20px 8px 20px", clipPath: "none" },
  { label: "Trueno Claro", iconKey: "cloudLightning", description: "Pulso de tormenta", background: "linear-gradient(135deg, #64748b 0%, #bae6fd 100%)", radius: "999px 999px 12px 999px", clipPath: "none" },
  { label: "Vórtice Solar", iconKey: "orbit", description: "Rotación cálida", background: "linear-gradient(135deg, #f97316 0%, #fef08a 100%)", radius: "999px", clipPath: "polygon(50% 0%, 92% 18%, 100% 58%, 68% 100%, 22% 88%, 0% 42%)" },
  { label: "Nube Iónica", iconKey: "cloudSun", description: "Carga en suspensión", background: "linear-gradient(135deg, #14b8a6 0%, #d9f99d 100%)", radius: "20px 999px 20px 999px", clipPath: "none" },
  { label: "Pulso Eléctrico", iconKey: "activity", description: "Frecuencia activa", background: "linear-gradient(135deg, #22c55e 0%, #67e8f9 100%)", radius: "999px 10px 999px 10px", clipPath: "none" },
  { label: "Arco Plasma", iconKey: "magnet", description: "Campo experimental", background: "linear-gradient(135deg, #a855f7 0%, #f0abfc 100%)", radius: "999px 999px 10px 10px", clipPath: "none" },
  { label: "Frente de Tormenta", iconKey: "cloudRainWind", description: "Avance intenso", background: "linear-gradient(135deg, #0f172a 0%, #64748b 100%)", radius: "8px", clipPath: "none" },
  { label: "Aurora Boreal", iconKey: "waves", description: "Luz polar", background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Lluvia Solar", iconKey: "cloudSunRain", description: "Brillo líquido", background: "linear-gradient(135deg, #f59e0b 0%, #38bdf8 100%)", radius: "18px", clipPath: "none" },
  { label: "Ciclón Azul", iconKey: "tornado", description: "Giro de presión", background: "linear-gradient(135deg, #1d4ed8 0%, #67e8f9 100%)", radius: "999px", clipPath: "polygon(50% 0%, 100% 35%, 82% 100%, 18% 100%, 0% 35%)" },
  { label: "Neblina Polar", iconKey: "cloudFog", description: "Frío suspendido", background: "linear-gradient(135deg, #94a3b8 0%, #e0f2fe 100%)", radius: "999px 999px 12px 12px", clipPath: "none" },
  { label: "Granizo Veloz", iconKey: "cloudHail", description: "Impactos fríos", background: "linear-gradient(135deg, #475569 0%, #dbeafe 100%)", radius: "12px", clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)" },
  { label: "Marea Magnética", iconKey: "waves", description: "Flujo cargado", background: "linear-gradient(135deg, #0ea5e9 0%, #db2777 100%)", radius: "999px 12px 999px 12px", clipPath: "none" },
  { label: "Órbita Lunar", iconKey: "moon", description: "Trayectoria nocturna", background: "linear-gradient(135deg, #312e81 0%, #c7d2fe 100%)", radius: "999px", clipPath: "none" },
  { label: "Corona Solar", iconKey: "sun", description: "Anillo radiante", background: "linear-gradient(135deg, #facc15 0%, #fb7185 100%)", radius: "999px", clipPath: "polygon(50% 0%, 88% 12%, 100% 50%, 88% 88%, 50% 100%, 12% 88%, 0% 50%, 12% 12%)" },
  { label: "Eclipse Marino", iconKey: "circleDot", description: "Sombra oceánica", background: "linear-gradient(135deg, #020617 0%, #0ea5e9 100%)", radius: "999px 999px 999px 8px", clipPath: "none" },
  { label: "Bruma Eléctrica", iconKey: "cloudFog", description: "Voltaje suave", background: "linear-gradient(135deg, #64748b 0%, #facc15 100%)", radius: "18px 8px 18px 8px", clipPath: "none" },
  { label: "Tornado Prisma", iconKey: "tornado", description: "Rotación luminosa", background: "linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)", radius: "12px 999px 12px 999px", clipPath: "none" },
  { label: "Onda Sísmica", iconKey: "audioWaveform", description: "Vibración profunda", background: "linear-gradient(135deg, #92400e 0%, #fed7aa 100%)", radius: "8px", clipPath: "none" },
  { label: "Llama Boreal", iconKey: "flame", description: "Fuego frío", background: "linear-gradient(135deg, #ef4444 0%, #34d399 100%)", radius: "999px 999px 999px 12px", clipPath: "none" },
  { label: "Cristal de Hielo", iconKey: "snowflake", description: "Estructura precisa", background: "linear-gradient(135deg, #38bdf8 0%, #f8fafc 100%)", radius: "10px", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" },
  { label: "Ráfaga Andina", iconKey: "wind", description: "Corriente alta", background: "linear-gradient(135deg, #16a34a 0%, #bfdbfe 100%)", radius: "999px 10px 10px 999px", clipPath: "none" },
  { label: "Meteoro Verde", iconKey: "star", description: "Trayectoria fugaz", background: "linear-gradient(135deg, #16a34a 0%, #fef08a 100%)", radius: "14px", clipPath: "polygon(50% 0%, 95% 35%, 78% 100%, 22% 100%, 5% 35%)" },
  { label: "Anillo de Plasma", iconKey: "orbit", description: "Circuito brillante", background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)", radius: "999px", clipPath: "none" },
  { label: "Ojo del Huracán", iconKey: "circleDot", description: "Calma central", background: "linear-gradient(135deg, #0f172a 0%, #f8fafc 100%)", radius: "999px", clipPath: "none" },
  { label: "Rocío Cósmico", iconKey: "droplets", description: "Partículas brillantes", background: "linear-gradient(135deg, #22d3ee 0%, #c084fc 100%)", radius: "999px 12px 999px 12px", clipPath: "none" },
  { label: "Campo Magnético", iconKey: "magnet", description: "Atracción estable", background: "linear-gradient(135deg, #be123c 0%, #bfdbfe 100%)", radius: "16px", clipPath: "none" },
  { label: "Estrella Pulsante", iconKey: "sparkles", description: "Brillo rítmico", background: "linear-gradient(135deg, #fef08a 0%, #f472b6 100%)", radius: "999px", clipPath: "polygon(50% 0%, 62% 34%, 98% 35%, 68% 56%, 79% 92%, 50% 70%, 21% 92%, 32% 56%, 2% 35%, 38% 34%)" },
  { label: "Nebulosa Ámbar", iconKey: "asterisk", description: "Nube estelar", background: "linear-gradient(135deg, #d97706 0%, #f0abfc 100%)", radius: "18px 999px 18px 999px", clipPath: "none" },
  { label: "Fulgor Atlántico", iconKey: "waves", description: "Destello marino", background: "linear-gradient(135deg, #0369a1 0%, #facc15 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Monzón Dorado", iconKey: "cloudRain", description: "Lluvia intensa", background: "linear-gradient(135deg, #ca8a04 0%, #93c5fd 100%)", radius: "12px 12px 999px 999px", clipPath: "none" },
  { label: "Cascada Lunar", iconKey: "droplets", description: "Caída nocturna", background: "linear-gradient(135deg, #1e3a8a 0%, #e0e7ff 100%)", radius: "999px 999px 999px 6px", clipPath: "none" },
  { label: "Volcán Azul", iconKey: "mountain", description: "Fuerza mineral", background: "linear-gradient(135deg, #1d4ed8 0%, #fb923c 100%)", radius: "8px", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" },
  { label: "Cometa Naranja", iconKey: "flame", description: "Cola ardiente", background: "linear-gradient(135deg, #ea580c 0%, #fde68a 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Halo Nocturno", iconKey: "moon", description: "Luz de borde", background: "linear-gradient(135deg, #111827 0%, #818cf8 100%)", radius: "999px", clipPath: "none" },
  { label: "Magma Solar", iconKey: "flame", description: "Calor expansivo", background: "linear-gradient(135deg, #b91c1c 0%, #facc15 100%)", radius: "16px 16px 999px 999px", clipPath: "none" },
  { label: "Arrecife Eléctrico", iconKey: "leaf", description: "Vida cargada", background: "linear-gradient(135deg, #059669 0%, #38bdf8 100%)", radius: "999px 12px 999px 12px", clipPath: "none" },
  { label: "Bosque Iónico", iconKey: "leaf", description: "Crecimiento activo", background: "linear-gradient(135deg, #166534 0%, #bbf7d0 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Cumbre Nevada", iconKey: "mountainSnow", description: "Altura fría", background: "linear-gradient(135deg, #475569 0%, #f8fafc 100%)", radius: "8px", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" },
  { label: "Duna Radiante", iconKey: "sun", description: "Arena luminosa", background: "linear-gradient(135deg, #d97706 0%, #fde68a 100%)", radius: "12px 999px 12px 999px", clipPath: "none" },
  { label: "Río de Luz", iconKey: "waves", description: "Flujo brillante", background: "linear-gradient(135deg, #0ea5e9 0%, #fef08a 100%)", radius: "999px 10px 999px 10px", clipPath: "none" },
  { label: "Lago de Plasma", iconKey: "circleDot", description: "Superficie activa", background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)", radius: "999px 999px 14px 14px", clipPath: "none" },
  { label: "Ráfaga Cobalto", iconKey: "wind", description: "Velocidad azul", background: "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)", radius: "8px 999px 999px 8px", clipPath: "none" },
  { label: "Tempestad Violeta", iconKey: "cloudLightning", description: "Tormenta rara", background: "linear-gradient(135deg, #581c87 0%, #c084fc 100%)", radius: "18px", clipPath: "none" },
  { label: "Faro Boreal", iconKey: "radar", description: "Señal visible", background: "linear-gradient(135deg, #065f46 0%, #fde68a 100%)", radius: "8px 18px 8px 18px", clipPath: "none" },
  { label: "Radar de Nubes", iconKey: "radar", description: "Lectura climática", background: "linear-gradient(135deg, #334155 0%, #93c5fd 100%)", radius: "999px", clipPath: "none" },
  { label: "Satélite Solar", iconKey: "satellite", description: "Órbita técnica", background: "linear-gradient(135deg, #0f172a 0%, #facc15 100%)", radius: "10px", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" },
  { label: "Partícula Omega", iconKey: "atom", description: "Energía elemental", background: "linear-gradient(135deg, #0891b2 0%, #a78bfa 100%)", radius: "999px", clipPath: "none" },
  { label: "Brisa Solar", iconKey: "wind", description: "Calma luminosa", background: "linear-gradient(135deg, #facc15 0%, #bae6fd 100%)", radius: "999px 12px 999px 12px", clipPath: "none" },
  { label: "Nimbo Dorado", iconKey: "cloudSun", description: "Nube brillante", background: "linear-gradient(135deg, #ca8a04 0%, #fef3c7 100%)", radius: "18px", clipPath: "none" },
  { label: "Ceniza Lunar", iconKey: "moon", description: "Sombra suave", background: "linear-gradient(135deg, #374151 0%, #cbd5e1 100%)", radius: "999px 999px 999px 8px", clipPath: "none" },
  { label: "Corriente Ártica", iconKey: "snowflake", description: "Flujo frío", background: "linear-gradient(135deg, #0284c7 0%, #f8fafc 100%)", radius: "8px 999px 999px 8px", clipPath: "none" },
  { label: "Pulso Boreal", iconKey: "activity", description: "Ritmo polar", background: "linear-gradient(135deg, #0f766e 0%, #a78bfa 100%)", radius: "999px", clipPath: "none" },
  { label: "Grieta Magnética", iconKey: "magnet", description: "Fuerza abierta", background: "linear-gradient(135deg, #831843 0%, #93c5fd 100%)", radius: "8px", clipPath: "polygon(12% 0%, 100% 0%, 82% 100%, 0% 100%)" },
  { label: "Mar de Chispas", iconKey: "sparkles", description: "Energía dispersa", background: "linear-gradient(135deg, #06b6d4 0%, #facc15 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Lágrima de Cometa", iconKey: "droplets", description: "Trayectoria líquida", background: "linear-gradient(135deg, #38bdf8 0%, #fb923c 100%)", radius: "999px 999px 999px 10px", clipPath: "none" },
  { label: "Viento Cobalto", iconKey: "wind", description: "Velocidad mineral", background: "linear-gradient(135deg, #1e40af 0%, #93c5fd 100%)", radius: "999px 10px 10px 999px", clipPath: "none" },
  { label: "Núcleo Radiante", iconKey: "circleDot", description: "Centro activo", background: "linear-gradient(135deg, #ea580c 0%, #fde047 100%)", radius: "999px", clipPath: "none" },
  { label: "Eco de Trueno", iconKey: "audioWaveform", description: "Sonido profundo", background: "linear-gradient(135deg, #475569 0%, #facc15 100%)", radius: "12px", clipPath: "none" },
  { label: "Sombra Solar", iconKey: "sun", description: "Contraste caliente", background: "linear-gradient(135deg, #020617 0%, #f59e0b 100%)", radius: "999px", clipPath: "polygon(50% 0%, 88% 12%, 100% 50%, 88% 88%, 50% 100%, 12% 88%, 0% 50%, 12% 12%)" },
  { label: "Luz de Tormenta", iconKey: "cloudLightning", description: "Destello climático", background: "linear-gradient(135deg, #111827 0%, #fde047 100%)", radius: "18px 8px 18px 8px", clipPath: "none" },
  { label: "Roca Estelar", iconKey: "mountain", description: "Materia firme", background: "linear-gradient(135deg, #57534e 0%, #c084fc 100%)", radius: "8px", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" },
  { label: "Niebla de Plasma", iconKey: "cloudFog", description: "Carga difusa", background: "linear-gradient(135deg, #7c3aed 0%, #67e8f9 100%)", radius: "999px 999px 12px 12px", clipPath: "none" },
  { label: "Línea de Fuego", iconKey: "flame", description: "Tensión caliente", background: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Rayo Cenital", iconKey: "bolt", description: "Descarga vertical", background: "linear-gradient(135deg, #facc15 0%, #60a5fa 100%)", radius: "8px", clipPath: "polygon(42% 0%, 82% 0%, 58% 38%, 100% 38%, 34% 100%, 47% 56%, 12% 56%)" },
  { label: "Manto Polar", iconKey: "snowflake", description: "Cobertura fría", background: "linear-gradient(135deg, #64748b 0%, #e0f2fe 100%)", radius: "18px 18px 4px 4px", clipPath: "none" },
  { label: "Esfera Iónica", iconKey: "orbit", description: "Campo circular", background: "linear-gradient(135deg, #0891b2 0%, #bef264 100%)", radius: "999px", clipPath: "none" },
  { label: "Cauce Eléctrico", iconKey: "waves", description: "Flujo con carga", background: "linear-gradient(135deg, #0ea5e9 0%, #fde047 100%)", radius: "20px 999px 20px 999px", clipPath: "none" },
  { label: "Prisma Celeste", iconKey: "star", description: "Luz refractada", background: "linear-gradient(135deg, #38bdf8 0%, #c084fc 100%)", radius: "10px", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { label: "Flecha Solar", iconKey: "zap", description: "Dirección rápida", background: "linear-gradient(135deg, #f97316 0%, #fef08a 100%)", radius: "8px", clipPath: "polygon(50% 0%, 100% 55%, 70% 55%, 70% 100%, 30% 100%, 30% 55%, 0% 55%)" },
  { label: "Gota de Aurora", iconKey: "droplets", description: "Color líquido", background: "linear-gradient(135deg, #22c55e 0%, #a78bfa 100%)", radius: "999px 999px 999px 8px", clipPath: "none" },
  { label: "Cristal Marino", iconKey: "snowflake", description: "Agua precisa", background: "linear-gradient(135deg, #06b6d4 0%, #dbeafe 100%)", radius: "10px", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" },
  { label: "Ancla Magnética", iconKey: "magnet", description: "Estabilidad cargada", background: "linear-gradient(135deg, #1f2937 0%, #facc15 100%)", radius: "14px", clipPath: "none" },
  { label: "Círculo Boreal", iconKey: "circleDot", description: "Anillo polar", background: "linear-gradient(135deg, #10b981 0%, #818cf8 100%)", radius: "999px", clipPath: "none" },
  { label: "Cumbre de Fuego", iconKey: "mountain", description: "Altura ardiente", background: "linear-gradient(135deg, #b91c1c 0%, #fbbf24 100%)", radius: "8px", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" },
  { label: "Arista Lunar", iconKey: "moon", description: "Borde nocturno", background: "linear-gradient(135deg, #312e81 0%, #e5e7eb 100%)", radius: "10px", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { label: "Ola Violeta", iconKey: "waves", description: "Movimiento raro", background: "linear-gradient(135deg, #7e22ce 0%, #22d3ee 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Llama Cobalto", iconKey: "flame", description: "Fuego azul", background: "linear-gradient(135deg, #1d4ed8 0%, #fb7185 100%)", radius: "999px 999px 999px 10px", clipPath: "none" },
  { label: "Nexo de Nubes", iconKey: "cloudSunRain", description: "Conexión climática", background: "linear-gradient(135deg, #64748b 0%, #fde047 100%)", radius: "16px", clipPath: "none" },
  { label: "Estela Dorada", iconKey: "star", description: "Rastro brillante", background: "linear-gradient(135deg, #f59e0b 0%, #fef3c7 100%)", radius: "999px 10px 999px 10px", clipPath: "none" },
  { label: "Campo de Granizo", iconKey: "cloudHail", description: "Impacto múltiple", background: "linear-gradient(135deg, #475569 0%, #bfdbfe 100%)", radius: "12px", clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)" },
  { label: "Marea Boreal", iconKey: "waves", description: "Corriente polar", background: "linear-gradient(135deg, #0f766e 0%, #c084fc 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Sol de Medianoche", iconKey: "sun", description: "Brillo nocturno", background: "linear-gradient(135deg, #111827 0%, #fde047 100%)", radius: "999px", clipPath: "polygon(50% 0%, 88% 12%, 100% 50%, 88% 88%, 50% 100%, 12% 88%, 0% 50%, 12% 12%)" },
  { label: "Rastro de Centella", iconKey: "sparkles", description: "Marca veloz", background: "linear-gradient(135deg, #facc15 0%, #a78bfa 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Eje de Tormenta", iconKey: "tornado", description: "Centro dinámico", background: "linear-gradient(135deg, #0f172a 0%, #38bdf8 100%)", radius: "999px", clipPath: "polygon(50% 0%, 100% 35%, 82% 100%, 18% 100%, 0% 35%)" },
  { label: "Rumbo Estelar", iconKey: "satellite", description: "Trayectoria guiada", background: "linear-gradient(135deg, #1e3a8a 0%, #f0abfc 100%)", radius: "10px", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" },
  { label: "Brújula Solar", iconKey: "radar", description: "Orientación cálida", background: "linear-gradient(135deg, #ca8a04 0%, #60a5fa 100%)", radius: "999px", clipPath: "none" },
  { label: "Nodo de Plasma", iconKey: "atom", description: "Punto energético", background: "linear-gradient(135deg, #7c3aed 0%, #facc15 100%)", radius: "12px", clipPath: "none" },
  { label: "Raíz Iónica", iconKey: "leaf", description: "Base cargada", background: "linear-gradient(135deg, #166534 0%, #67e8f9 100%)", radius: "999px 8px 999px 8px", clipPath: "none" },
  { label: "Corteza Lunar", iconKey: "moon", description: "Superficie nocturna", background: "linear-gradient(135deg, #334155 0%, #c7d2fe 100%)", radius: "18px 18px 4px 4px", clipPath: "none" },
  { label: "Pico Relámpago", iconKey: "zap", description: "Altura eléctrica", background: "linear-gradient(135deg, #facc15 0%, #38bdf8 100%)", radius: "8px", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" },
  { label: "Nube de Cristal", iconKey: "cloudFog", description: "Vapor preciso", background: "linear-gradient(135deg, #94a3b8 0%, #f8fafc 100%)", radius: "10px", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" },
  { label: "Órbita Esmeralda", iconKey: "orbit", description: "Ruta verde", background: "linear-gradient(135deg, #047857 0%, #a7f3d0 100%)", radius: "999px", clipPath: "none" },
  { label: "Fuego Austral", iconKey: "flame", description: "Calor del sur", background: "linear-gradient(135deg, #ea580c 0%, #22c55e 100%)", radius: "999px 999px 999px 10px", clipPath: "none" },
  { label: "Rocío Polar", iconKey: "droplets", description: "Frío brillante", background: "linear-gradient(135deg, #38bdf8 0%, #f8fafc 100%)", radius: "999px 999px 999px 8px", clipPath: "none" },
  { label: "Cinturón de Luz", iconKey: "orbit", description: "Anillo radiante", background: "linear-gradient(135deg, #facc15 0%, #06b6d4 100%)", radius: "999px", clipPath: "none" },
  { label: "Rayo Submarino", iconKey: "bolt", description: "Descarga profunda", background: "linear-gradient(135deg, #075985 0%, #facc15 100%)", radius: "8px", clipPath: "polygon(42% 0%, 82% 0%, 58% 38%, 100% 38%, 34% 100%, 47% 56%, 12% 56%)" },
  { label: "Horizonte Omega", iconKey: "sun", description: "Borde final", background: "linear-gradient(135deg, #0f172a 0%, #fef08a 100%)", radius: "18px 18px 4px 4px", clipPath: "none" },
];

export const leaderboardLevels = [
  {
    name: "Chispa",
    threshold: "0-49%",
    description: "Inicio de actividad: primeras entregas, quiz y asistencias registradas.",
  },
  {
    name: "Centella",
    threshold: "50%+",
    description: "Ritmo consistente con más de la mitad del recorrido acumulado.",
  },
  {
    name: "Rayo",
    threshold: "75%+",
    description: "Avance sólido en asistencia, quizzes y tareas revisadas.",
  },
  {
    name: "Relámpago",
    threshold: "90%+",
    description: "Nivel élite del programa, reservado para desempeño casi completo.",
  },
];

export function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}


export function getGeneratedAvatarPreset(seed: string) {
  const total = seed
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return avatarPresets[total % avatarPresets.length];
}

export function getAvatarPreset(savedValue: string | null | undefined, seed: string) {
  if (savedValue?.startsWith("{")) {
    try {
      const customValue = JSON.parse(savedValue) as Partial<AvatarPreset>;
      const basePreset =
        avatarPresets.find((preset) => preset.label === customValue.label) ||
        getGeneratedAvatarPreset(seed);

      return {
        ...basePreset,
        background: customValue.background || basePreset.background,
        radius: customValue.radius || basePreset.radius,
        clipPath: customValue.clipPath || basePreset.clipPath,
      };
    } catch {
      return getGeneratedAvatarPreset(seed);
    }
  }

  return (
    avatarPresets.find(
      (preset) =>
        preset.label === savedValue || preset.background === savedValue,
    ) || getGeneratedAvatarPreset(seed)
  );
}

export function getInitials(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "RA";
}

export function getLevelClass(level: string) {
  return `is-${level
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()}`;
}
