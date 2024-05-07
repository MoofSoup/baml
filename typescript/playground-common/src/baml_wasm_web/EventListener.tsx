import { WasmDiagnosticError, WasmProject, WasmRuntime, type WasmRuntimeContext } from '@gloo-ai/baml-schema-wasm-web'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomFamily, atomWithStorage } from 'jotai/utils'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import CustomErrorBoundary from '../utils/ErrorFallback'
import { sessionStore } from './JotaiProvider'
import { availableProjectsAtom, projectFamilyAtom, projectFilesAtom, runtimeFamilyAtom } from './baseAtoms'
import type BamlProjectManager from './project_manager'

// const wasm = await import("@gloo-ai/baml-schema-wasm-web/baml_schema_build");
// const { WasmProject, WasmRuntime, WasmRuntimeContext, version: RuntimeVersion } = wasm;

const selectedProjectStorageAtom = atomWithStorage<string | null>('selected-project', null, sessionStore)
const selectedFunctionStorageAtom = atomWithStorage<string | null>('selected-function', null, sessionStore)
export const envvarStorageAtom = atomWithStorage<Record<string, string>>('environment-variables', {}, sessionStore)

type Selection = {
  project?: string
  function?: string
  testCase?: string
}

type ASTContextType = {
  projectMangager: BamlProjectManager
  // Things associated with selection
  selected: Selection
}
// const wasm = await import('@gloo-ai/baml-schema-wasm-web')
// const wasm = undefined

const wasmAtom = atom(async () => {
  const wasm = await import('@gloo-ai/baml-schema-wasm-web/baml_schema_build')

  return wasm
})

export const runtimeCtx = atom<Promise<WasmRuntimeContext>>(async (get, { signal }) => {
  const loadedWasm = await get(wasmAtom)

  const ctx = new loadedWasm.WasmRuntimeContext()

  for (const [key, value] of Object.entries(get(envvarStorageAtom))) {
    ctx.set_env(key, value)
  }

  return ctx
})

const selectedProjectAtom = atom(
  (get) => {
    const allProjects = get(availableProjectsAtom)
    const project = get(selectedProjectStorageAtom)
    const match = allProjects.find((p) => p === project) ?? allProjects.at(0) ?? null
    return match
  },
  (get, set, project: string) => {
    if (project !== null) {
      set(selectedProjectStorageAtom, project)
    }
  },
)

export const selectedFunctionAtom = atom(
  async (get) => {
    const functions = await get(availableFunctionsAtom)
    const func = get(selectedFunctionStorageAtom)
    const match = functions.find((f) => f.name === func) ?? functions.at(0)
    return match ?? null
  },
  (get, set, func: string) => {
    if (func !== null) {
      set(selectedFunctionStorageAtom, func)
    }
  },
)

const rawSelectedTestCaseAtom = atom<string | null>(null)
export const selectedTestCaseAtom = atom(
  async (get) => {
    const func = await get(selectedFunctionAtom)
    const testCases = func?.test_cases ?? []
    const testCase = get(rawSelectedTestCaseAtom)
    const match = testCases.find((tc) => tc.name === testCase) ?? testCases.at(0)
    return match ?? null
  },
  (get, set, testCase: string) => {
    set(rawSelectedTestCaseAtom, testCase)
  },
)

const removeProjectAtom = atom(null, (get, set, root_path: string) => {
  set(projectFilesAtom(root_path), {})
  set(projectFamilyAtom(root_path), null)
  set(runtimeFamilyAtom(root_path), { last_attempt: 'no_attempt_yet' })
  const availableProjects = get(availableProjectsAtom)
  set(
    availableProjectsAtom,
    availableProjects.filter((p) => p !== root_path),
  )
})

export const updateFileAtom = atom(
  null,
  async (
    get,
    set,
    {
      reason,
      root_path,
      files,
      renames,
      replace_all,
    }: {
      reason: string
      root_path: string
      files: { name: string; content: string | undefined }[]
      renames?: { from: string; to: string }[]
      replace_all?: true
    },
  ) => {
    const wasm = await get(wasmAtom)
    console.debug(`Updating files due to ${reason}: ${files.length} files (${replace_all ? 'replace all' : 'update'})`)
    const _projFiles = get(projectFilesAtom(root_path))
    const filesToDelete = files.filter((f) => f.content === undefined).map((f) => f.name)
    let projFiles = {
      ..._projFiles,
    }
    const filesToModify = files
      .filter((f) => f.content !== undefined)
      .map((f): [string, string] => [f.name, f.content as string])
    if (replace_all) {
      for (const file of Object.keys(_projFiles)) {
        if (!filesToDelete.includes(file)) {
          filesToDelete.push(file)
        }
      }
      projFiles = Object.fromEntries(filesToModify)
    }

    let project = get(projectFamilyAtom(root_path))
    if (project && !replace_all) {
      for (const file of filesToDelete) {
        if (file.startsWith(root_path)) {
          project.update_file(file, undefined)
        }
      }
      for (const [name, content] of filesToModify) {
        if (name.startsWith(root_path)) {
          project.update_file(name, content)
        }
      }
    } else {
      const onlyRelevantFiles = Object.fromEntries(
        Object.entries(projFiles).filter(([name, _]) => name.startsWith(root_path)),
      )
      project = wasm.WasmProject.new(root_path, onlyRelevantFiles)
    }
    let rt = undefined
    let diag = undefined

    try {
      if (!project) {
        throw new Error('couldnt load wasm')
      }
      rt = project.runtime()
      diag = project.diagnostics(rt)
    } catch (e) {
      const WasmDiagnosticError = wasm.WasmDiagnosticError
      if (e instanceof Error) {
        console.error(e.message)
      } else if (e instanceof WasmDiagnosticError) {
        diag = e
      } else {
        console.error(e)
      }
    }

    const pastRuntime = get(runtimeFamilyAtom(root_path))
    const lastSuccessRt = pastRuntime.current_runtime ?? pastRuntime.last_successful_runtime

    const availableProjects = get(availableProjectsAtom)
    if (!availableProjects.includes(root_path)) {
      set(availableProjectsAtom, [...availableProjects, root_path])
    }

    set(projectFilesAtom(root_path), projFiles)
    set(projectFamilyAtom(root_path), project)
    set(runtimeFamilyAtom(root_path), {
      last_attempt: 'success',
      last_successful_runtime: lastSuccessRt,
      current_runtime: rt,
      diagnostics: diag,
    })
  },
)

export const selectedRuntimeAtom = atom((get) => {
  const project = get(selectedProjectAtom)
  if (!project) {
    return null
  }

  const runtime = get(runtimeFamilyAtom(project))
  if (runtime.current_runtime) return runtime.current_runtime
  if (runtime.last_successful_runtime) return runtime.last_successful_runtime
  if (runtime.last_attempt === null) {
  }
  return null
})

export const runtimeRequiredEnvVarsAtom = atom((get) => {
  const runtime = get(selectedRuntimeAtom)
  if (!runtime) {
    return []
  }

  return runtime.required_env_vars()
})

const selectedDiagnosticsAtom = atom((get) => {
  const project = get(selectedProjectAtom)
  if (!project) {
    return null
  }

  const runtime = get(runtimeFamilyAtom(project))
  return runtime.diagnostics ?? null
})

export const versionAtom = atom(async (get) => {
  const wasm = await get(wasmAtom)

  return wasm.version()
})

export const availableFunctionsAtom = atom(async (get) => {
  const runtime = get(selectedRuntimeAtom)
  if (!runtime) {
    return []
  }
  const ctx = await get(runtimeCtx)
  return runtime.list_functions(ctx)
})

export const renderPromptAtom = atom(async (get) => {
  const runtime = get(selectedRuntimeAtom)
  const func = await get(selectedFunctionAtom)
  const test_case = await get(selectedTestCaseAtom)
  const ctx = await get(runtimeCtx)

  if (!runtime || !func || !test_case) {
    return null
  }

  const params = Object.fromEntries(test_case.inputs.map((input) => [input.name, JSON.parse(input.value)]))

  try {
    return func.render_prompt(runtime, ctx, params)
  } catch (e) {
    if (e instanceof Error) {
      return e.message
    } else {
      return `${e}`
    }
  }
})

export const diagnositicsAtom = atom((get) => {
  const diagnostics = get(selectedDiagnosticsAtom)
  if (!diagnostics) {
    return []
  }

  return diagnostics.errors()
})

export const numErrorsAtom = atom((get) => {
  const errors = get(diagnositicsAtom)

  const warningCount = errors.filter((e) => e.type === 'warning').length

  return { errors: errors.length - warningCount, warnings: warningCount }
})

const ErrorCount: React.FC = () => {
  const { errors, warnings } = useAtomValue(numErrorsAtom)
  if (errors === 0 && warnings === 0) {
    return (
      <div className='flex flex-row items-center gap-1 text-green-600'>
        <CheckCircle size={12} />
      </div>
    )
  }
  if (errors === 0) {
    return (
      <div className='flex flex-row items-center gap-1 text-yellow-600'>
        {warnings} <AlertTriangle size={12} />
      </div>
    )
  }
  return (
    <div className='flex flex-row items-center gap-1 text-red-600'>
      {errors} <XCircle size={12} /> {warnings} <AlertTriangle size={12} />{' '}
    </div>
  )
}

// We don't use ASTContext.provider because we should the default value of the context
export const EventListener: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const updateFile = useSetAtom(updateFileAtom)
  const removeProject = useSetAtom(removeProjectAtom)
  const availableProjects = useAtomValue(availableProjectsAtom)
  const [selectedProject, setSelectedProject] = useAtom(selectedProjectAtom)
  // const setRuntimeCtx = useSetAtom(runtimeCtxRaw);
  const version = useAtomValue(versionAtom)

  useEffect(() => {
    const fn = (
      event: MessageEvent<
        | {
            command: 'modify_file'
            content: {
              root_path: string
              name: string
              content: string | undefined
            }
          }
        | {
            command: 'add_project'
            content: {
              root_path: string
              files: Record<string, string>
            }
          }
        | {
            command: 'remove_project'
            content: {
              root_path: string
            }
          }
      >,
    ) => {
      const { command, content } = event.data

      switch (command) {
        case 'modify_file':
          updateFile({
            reason: 'modify_file',
            root_path: content.root_path,
            files: [{ name: content.name, content: content.content }],
          })
          break
        case 'add_project':
          updateFile({
            reason: 'add_project',
            root_path: content.root_path,
            files: Object.entries(content.files).map(([name, content]) => ({ name, content })),
            replace_all: true,
          })
          break
        case 'remove_project':
          removeProject(content.root_path)
          break
      }
    }

    window.addEventListener('message', fn)

    return () => window.removeEventListener('message', fn)
  })

  return (
    <>
      <div className='absolute flex flex-row gap-2 text-xs right-2 bottom-2'>
        <ErrorCount /> <span>Runtime Version: {version}</span>
      </div>
      {selectedProject === null ? (
        availableProjects.length === 0 ? (
          <div>
            No baml projects loaded yet
            <br />
            Open a baml file or wait for the extension to finish loading!
          </div>
        ) : (
          <div>
            <h1>Projects</h1>
            <div>
              {availableProjects.map((root_dir) => (
                <div key={root_dir}>
                  <VSCodeButton onClick={() => setSelectedProject(root_dir)}>{root_dir}</VSCodeButton>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <CustomErrorBoundary>{children}</CustomErrorBoundary>
      )}
    </>
  )
}
