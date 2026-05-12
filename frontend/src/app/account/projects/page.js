'use client'
import { useState, useEffect } from 'react'
import useProjectsStore from '@/store/projectsStore'
import useUiStore from '@/store/uiStore'
import ProjectCard from '@/components/account/ProjectCard'
import ProjectForm from '@/components/account/ProjectForm'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const projects = useProjectsStore(s => s.projects)
  const createProject = useProjectsStore(s => s.createProject)
  const addToast = useUiStore(s => s.addToast)

  const handleCreate = (data) => {
    createProject(data)
    setCreateModalOpen(false)
    addToast('Проект создан', 'success')
  }

  if (!mounted) {
    return <div style={{ height: 200, background: 'var(--surface)', borderRadius: 8 }} />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          Мои проекты
        </h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          + Новый проект
        </Button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🗂</div>
          <h2 style={{ fontSize: 22, margin: '0 0 8px', color: 'var(--text)' }}>
            Проектов пока нет
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: 15, lineHeight: 1.6 }}>
            Создайте проект, чтобы планировать закупки, отслеживать бюджет и делиться сметой
          </p>
          <Button onClick={() => setCreateModalOpen(true)}>+ Создать первый проект</Button>
        </div>
      )}

      {/* Projects grid */}
      {projects.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Новый проект"
        maxWidth={440}
      >
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setCreateModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
