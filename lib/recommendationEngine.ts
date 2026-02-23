/* eslint-disable @typescript-eslint/no-explicit-any */
import recommendations from "@/data/recommendations.json"

interface TechStack {
  frontend_stack?: string
  backend_stack?: string
  cloud_platform?: string
  metric?: string
}

export function generateRecommendations({
  roleKey,
  specialization,
  seniority = 'junior',
  techStack
}: {
  roleKey: string
  specialization?: string
  seniority?: 'junior' | 'senior'
  techStack?: TechStack
}) {
  const roles = (recommendations as any).roles
  const role = roles[roleKey]
  if (!role) return []
  const spec = specialization ? role.specializations[specialization]:'general';
  let bullets
  if(seniority && spec){
    bullets = spec?.bullets[seniority] || spec.bullets['junior'] || []
  }else{
    bullets = role.specializations.general?.bullets['junior'] || []
  }

  return bullets.map((bullet: string) => {
    // Deterministic random metric based on bullet content hash
    let hash = 0;
    for (let i = 0; i < bullet.length; i++) {
      hash = (hash << 5) - hash + bullet.charCodeAt(i);
      hash |= 0;
    }
    const randomMetric = (Math.abs(hash) % (45 - 15 + 1)) + 15;
    
    let processed = bullet
      .replace("{{metric}}", techStack?.metric || randomMetric.toString());

    // Only apply tech placeholders if they exist in the bullet and we have values
    // Using sensible defaults only if the role category suggests tech context
    const isTechRole = roleKey.includes('engineer') || roleKey.includes('developer') || roleKey.includes('analyst');
    
    if (processed.includes("{{frontend_stack}}")) {
      processed = processed.replace("{{frontend_stack}}", techStack?.frontend_stack || (isTechRole ? "React" : "relevant tools"));
    }
    if (processed.includes("{{backend_stack}}")) {
      processed = processed.replace("{{backend_stack}}", techStack?.backend_stack || (isTechRole ? "Node.js" : "backend systems"));
    }
    if (processed.includes("{{cloud_platform}}")) {
      processed = processed.replace("{{cloud_platform}}", techStack?.cloud_platform || (isTechRole ? "AWS" : "cloud infrastructure"));
    }

    return processed;
  })
}
