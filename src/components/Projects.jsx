import { useState, useRef, useEffect, useCallback } from 'react'
import { useGsapContext } from '../hooks/useGsapContext'
import { createProjectsReveal } from '../animations'
import './Projects.css'

const CATEGORIES = [
  {
    id: 'edc',
    label: 'EDC',
    subcategories: [
      {
        id: 'pen',
        label: '笔',
        items: [
          { id: 'pen-1', title: '钢笔式毛笔', image: '/images/project-01.jpg' },
          { id: 'pen-2', title: '棱光钢笔', image: '/images/project-02.jpg' },
        ],
      },
      {
        id: 'pendant',
        label: '吊坠',
        items: [
          { id: 'pendant-1', title: '氚管灯', image: '/images/project-03.jpg' },
          { id: 'pendant-2', title: '氚管吊坠饰品', image: '/images/project-04.jpg' },
          { id: 'pendant-3', title: 'mini打火机', image: '/images/project-01.jpg' },
        ],
      },
      {
        id: 'knife',
        label: '刀',
        items: [
          { id: 'knife-1', title: '直刀', image: '/images/project-02.jpg' },
          { id: 'knife-2', title: '无外露螺丝折刀', image: '/images/project-03.jpg' },
          { id: 'knife-3', title: '折刀2', image: '/images/project-04.jpg' },
          { id: 'knife-4', title: '折刀3', image: '/images/project-01.jpg' },
        ],
      },
      {
        id: 'toy',
        label: '指尖玩具',
        items: [
          { id: 'toy-1', title: '陀螺灯', image: '/images/project-02.jpg' },
          { id: 'toy-2', title: '戒指', image: '/images/project-03.jpg' },
        ],
      },
    ],
  },
  {
    id: 'appliances',
    label: '家电',
    subcategories: [
      {
        id: 'appliances-all',
        label: '全部',
        items: [
          { id: 'app-1', title: '空气炸锅', image: '/images/project-01.jpg' },
          { id: 'app-2', title: '挂烫机', image: '/images/project-02.jpg' },
          { id: 'app-3', title: '萃茶机', image: '/images/project-03.jpg' },
          { id: 'app-4', title: '电煮锅', image: '/images/project-04.jpg' },
        ],
      },
    ],
  },
  {
    id: 'furniture',
    label: '家具',
    subcategories: [
      {
        id: 'furniture-all',
        label: '全部',
        items: [
          { id: 'furn-1', title: '可编辑家具', image: '/images/project-01.jpg' },
        ],
      },
    ],
  },
  {
    id: 'electronics',
    label: '消费电子',
    subcategories: [],
  },
]

const ITEMS_PER_PAGE = 3

function ProjectCard({ project, index }) {
  return (
    <article
      className="projects__card"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="projects__card-image">
        <div className="projects__card-placeholder-img" />
      </div>
      <div className="projects__card-info">
        <h3 className="projects__card-title">{project.title}</h3>
      </div>
    </article>
  )
}

function Projects() {
  const [activeCategory, setActiveCategory] = useState('edc')
  const [activeSub, setActiveSub] = useState('pen')
  const [expandedSubs, setExpandedSubs] = useState({})
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const [subIndicatorStyle, setSubIndicatorStyle] = useState({})
  const tabsRef = useRef([])
  const subTabsRef = useRef([])
  const containerRef = useGsapContext(createProjectsReveal, [])

  const active = CATEGORIES.find((c) => c.id === activeCategory)
  const currentSub = active?.subcategories.find((s) => s.id === activeSub)

  const updateIndicator = useCallback((refs, setter, index) => {
    const tab = refs.current[index]
    if (tab) {
      setter({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
      })
    }
  }, [])

  const refreshIndicators = useCallback(() => {
    const idx = CATEGORIES.findIndex((c) => c.id === activeCategory)
    updateIndicator(tabsRef, setIndicatorStyle, idx)
    if (active?.subcategories.length > 0) {
      const subIdx = active.subcategories.findIndex((s) => s.id === activeSub)
      updateIndicator(subTabsRef, setSubIndicatorStyle, subIdx)
    }
  }, [activeCategory, activeSub, active, updateIndicator])

  // Set initial indicator positions & refresh on resize
  useEffect(() => {
    refreshIndicators()
    const handleResize = () => refreshIndicators()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [refreshIndicators])

  const handleTabEnter = (index) => updateIndicator(tabsRef, setIndicatorStyle, index)
  const handleTabLeave = () => {
    const idx = CATEGORIES.findIndex((c) => c.id === activeCategory)
    updateIndicator(tabsRef, setIndicatorStyle, idx)
  }
  const handleTabClick = (categoryId) => {
    setActiveCategory(categoryId)
    const cat = CATEGORIES.find((c) => c.id === categoryId)
    if (cat?.subcategories.length > 0) {
      setActiveSub(cat.subcategories[0].id)
      setExpandedSubs({})
    }
  }

  const handleSubEnter = (index) => updateIndicator(subTabsRef, setSubIndicatorStyle, index)
  const handleSubLeave = () => {
    if (active?.subcategories.length > 0) {
      const idx = active.subcategories.findIndex((s) => s.id === activeSub)
      updateIndicator(subTabsRef, setSubIndicatorStyle, idx)
    }
  }
  const handleSubClick = (subId) => {
    setActiveSub(subId)
    setExpandedSubs((prev) => ({ ...prev, [subId]: prev[subId] || false }))
  }

  const toggleExpand = (subId) => {
    setExpandedSubs((prev) => ({ ...prev, [subId]: !prev[subId] }))
  }

  // Get visible items for current subcategory
  const getVisibleItems = (sub) => {
    const isExpanded = expandedSubs[sub.id]
    if (isExpanded || sub.items.length <= ITEMS_PER_PAGE) {
      return sub.items
    }
    return sub.items.slice(0, ITEMS_PER_PAGE)
  }

  return (
    <section id="projects" className="projects" ref={containerRef}>
      <div className="projects__inner">
        <div className="projects__header">
          <span className="projects__section-label">Selected Work</span>
          <h2 className="projects__title">精选项目</h2>
        </div>

        {/* Main Category Tabs */}
        <nav className="projects__tabs">
          <div
            className="projects__tabs-indicator"
            style={{
              transform: `translateX(${indicatorStyle.left || 0}px)`,
              width: `${indicatorStyle.width || 0}px`,
            }}
          />
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.id}
              ref={(el) => (tabsRef.current[i] = el)}
              className={`projects__tab${
                activeCategory === cat.id ? ' projects__tab--active' : ''
              }`}
              onClick={() => handleTabClick(cat.id)}
              onMouseEnter={() => handleTabEnter(i)}
              onMouseLeave={handleTabLeave}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Sub-category Tabs */}
        {active && active.subcategories.length > 0 && (
          <>
            <div className="projects__tabs-separator" />
            <nav className="projects__subtabs">
              <div
                className="projects__subtabs-indicator"
                style={{
                  transform: `translateX(${subIndicatorStyle.left || 0}px)`,
                  width: `${subIndicatorStyle.width || 0}px`,
                }}
              />
              {active.subcategories.map((sub, i) => (
                <button
                  key={sub.id}
                  ref={(el) => (subTabsRef.current[i] = el)}
                  className={`projects__subtab${
                    activeSub === sub.id ? ' projects__subtab--active' : ''
                  }`}
                  onClick={() => handleSubClick(sub.id)}
                  onMouseEnter={() => handleSubEnter(i)}
                  onMouseLeave={handleSubLeave}
                >
                  {sub.label}
                </button>
              ))}
            </nav>
          </>
        )}

        {/* Works */}
        <div className="projects__works" key={`${activeCategory}-${activeSub}`}>
          {active && active.subcategories.length > 0 && currentSub ? (
            <>
              <div className="projects__subgroup-items">
                {getVisibleItems(currentSub).map((item, i) => (
                  <ProjectCard key={item.id} project={item} index={i} />
                ))}
              </div>

              {currentSub.items.length > ITEMS_PER_PAGE && (
                <button
                  className={`projects__expand${
                    expandedSubs[currentSub.id] ? ' projects__expand--open' : ''
                  }`}
                  onClick={() => toggleExpand(currentSub.id)}
                >
                  <span className="projects__expand-arrow" />
                </button>
              )}
            </>
          ) : (
            <div className="projects__empty">
              <p>更多作品即将上线</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Projects
