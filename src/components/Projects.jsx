import { useState } from 'react'
import './Projects.css'

const PROJECTS = [
  {
    id: 1,
    title: 'Flow 系列 — 智能家居控制终端',
    category: 'Product Design',
    year: '2025',
    color: '#e8e6e1',
    image: '/images/project-01.jpg',
  },
  {
    id: 2,
    title: 'Aura 香薰扩散器',
    category: 'Industrial Design',
    year: '2025',
    color: '#e3e5e8',
    image: '/images/project-02.jpg',
  },
  {
    id: 3,
    title: 'Lunar 照明系统',
    category: 'Lighting Design',
    year: '2024',
    color: '#e8e6e3',
    image: '/images/project-03.jpg',
  },
  {
    id: 4,
    title: 'Nest 模块化办公家具',
    category: 'Furniture Design',
    year: '2024',
    color: '#e5e4e2',
    image: '/images/project-04.jpg',
  },
]

function ProjectCard({ project, isLarge }) {
  const [imgError, setImgError] = useState(false)

  return (
    <article
      className={`projects__card${isLarge ? ' projects__card--large' : ''}`}
    >
      <div className="projects__card-image">
        {!imgError ? (
          <img
            src={project.image}
            alt={project.title}
            className="projects__card-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="projects__card-fallback"
            style={{ background: project.color }}
          >
            <span className="projects__card-placeholder">
              {project.title.split('—')[0].trim()}
            </span>
          </div>
        )}
      </div>
      <div className="projects__card-info">
        <div className="projects__card-meta">
          <span>{project.category}</span>
          <span className="projects__card-dot" />
          <span>{project.year}</span>
        </div>
        <h3 className="projects__card-title">{project.title}</h3>
      </div>
    </article>
  )
}

function Projects() {
  return (
    <section id="projects" className="projects">
      <div className="projects__inner">
        <div className="projects__header">
          <span className="projects__section-label">Selected Work</span>
          <h2 className="projects__title">精选项目</h2>
        </div>

        <div className="projects__grid">
          {PROJECTS.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              isLarge={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
