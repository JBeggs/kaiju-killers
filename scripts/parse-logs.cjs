#!/usr/bin/env node
/*
  Parse console logs to analyze Third Person drift/detachment.
  Usage:
    node scripts/parse-logs.cjs path/to/console.logs.txt
*/

const fs = require('fs')
const path = require('path')

function parseJSONSafe(chunk) {
  try { return JSON.parse(chunk) } catch { return null }
}

function toNumArr(a) { return Array.isArray(a) ? a.map(Number) : null }
function isVec3(a) {
  return Array.isArray(a) && a.length === 3 && a.every((n) => typeof n === 'number' && isFinite(n))
}

function dist(a, b) {
  if (!a || !b || a.length !== 3) return null
  const dx = a[0]-b[0], dy = a[1]-b[1], dz = a[2]-b[2]
  return Math.sqrt(dx*dx + dy*dy + dz*dz)
}

function main() {
  const fileArg = process.argv[2]
  if (!fileArg) {
    console.error('Usage: node scripts/parse-logs.cjs path/to/console.logs.txt')
    process.exit(1)
  }
  const logPath = path.resolve(fileArg)
  if (!fs.existsSync(logPath)) {
    console.error('Log file not found:', logPath)
    process.exit(1)
  }

  const text = fs.readFileSync(logPath, 'utf8')
  const lines = text.split(/\r?\n/)

  const frames = []
  const containers = []
  const animStrips = []
  const worldSamples = []
  const keyEvents = []
  const animEvents = []
  const clipLists = []
  const camSamples = []
  const skelReports = []
  const meshReports = []
  
  // NEW: Crash movement debugging data
  const crashFlowEvents = []
  const crashPropsEvents = []
  const crashWorldEvents = []
  const crashPositionAttempts = []
  const crashPositionResults = []
  const crashPositionChanges = []
  const crashScalingAnalysis = []
  const crashScalingResults = []
  const avatarExecutions = []
  const avatarRenderChecks = []
  const otherPlayersChecks = []
  const frameStarts = []
  const movementCalcs = []
  const keyDetections = []
  const positionUpdates = []
  const movementReturns = []
  const frameResults = []
  const movementStateUpdates = []
  const frameResultsJson = []
  const avatarExecsJson = []
  const moveCalcsJson = []
  const moveReturnsJson = []
  const posUpdatesJson = []
  
  // MODEL SETUP TRACKING
  const setupUseEffectStarts = []
  const setupUseEffectEnds = []
  const setupModelStarts = []
  const setupModelEnds = []
  const setupModelProceeds = []
  const groupClears = []
  const modelClones = []
  const modelAnalyzes = []
  const containerCreates = []
  const groupAdds = []
  const setupCleanups = []
  const setupDuplicateBlocks = []
  const componentMounts = []
  const componentUnmounts = []
  const avatarRenders = []
  const parentRenders = []
  const setupModelDepsChanges = []
  const duplicateInstanceBlocks = []
  const thirdPersonRenders = []
  const gamestoreChecks = []
  const movementStateChanges = []
  const keyboardHookCreates = []
  const keyboardStateChanges = []
  const conditionalChecks = []
  const beforeGroupAdds = []
  const afterGroupAdds = []
  const groupAddSuccesses = []
  const groupAddFails = []
  const groupAddErrors = []
  const avatarInstanceLogs = []
  const groupOnUpdateDebugLogs = []
  const aboutToCallOnMovementChangeLogs = []
  const insideStartTransitionLogs = []
  const resultStructureDebugLogs = []
  const updateMovementErrors = []
  const tpjFrameResultErrors = []
  const tpjFrameErrors = []
  const onStateChangeCalls = []
  const setMovementStateCalls = []
  const avatarPropsReceived = []
  const avatarFrameExecs = []
  const useFrameExecuting = []
  const afterResultStructureDebug = []
  const cameraFollowerUseFrame = []
  const beforeTpjFrameResult = []
  const afterTpjFrameResult = []
  const beforeTpjFrameJson = []
  const afterTpjFrameJson = []
  const scalingVerificationLogs = []
  const scaleCheckLogs = []

  for (const line of lines) {
    if (!line) continue

    // TP FRAME { ... }
    if (line.includes('TPJ FRAME')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) {
          frames.push({
            clock: payload.clock,
            delta: payload.delta,
            keys: payload.keys,
            isMoving: payload.isMoving,
            pos: toNumArr(payload.pos),
            camPos: toNumArr(payload.camPos),
            camTarget: toNumArr(payload.camTarget)
          })
        }
      }
      continue
    }
    if (line.includes('TP FRAME')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) {
          frames.push({
            clock: payload.clock,
            delta: payload.delta,
            keys: payload.keys,
            isMoving: payload.isMoving,
            pos: toNumArr(payload.pos),
            camPos: toNumArr(payload.camPos),
            camTarget: toNumArr(payload.camTarget)
          })
        }
      }
      continue
    }

    // TP CONTAINER { ... }
    if (line.includes('TPJ CONTAINER')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) {
          containers.push({
            label: payload.label || null,
            propsPos: toNumArr(payload.propsPos) || toNumArr(payload.movementPos) || null,
            groupWorld: toNumArr(payload.groupWorld) || null,
            containerLocal: toNumArr(payload.containerLocal) || toNumArr(payload.containerPos) || null,
            containerWorld: toNumArr(payload.containerWorld) || null,
            containerScale: toNumArr(payload.containerScale) || null,
            pivotLocal: toNumArr(payload.pivotLocal) || null,
            pivotWorld: toNumArr(payload.pivotWorld) || null
          })
        }
      }
      continue
    }
    if (line.includes('TP CONTAINER')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) {
          containers.push({
            propsPos: toNumArr(payload.propsPos) || toNumArr(payload.movementPos) || null,
            groupWorld: toNumArr(payload.groupWorld) || null,
            containerLocal: toNumArr(payload.containerLocal) || toNumArr(payload.containerPos) || null,
            containerWorld: toNumArr(payload.containerWorld) || null,
            containerScale: toNumArr(payload.containerScale) || null,
            pivotLocal: toNumArr(payload.pivotLocal) || null,
            pivotWorld: toNumArr(payload.pivotWorld) || null
          })
        }
      }
      continue
    }

    // TP ANIM STRIP { ... }
    if (line.includes('TP ANIM STRIP')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) animStrips.push(payload)
      }
      continue
    }

    // TPJ WORLD { ... }
    if (line.includes('TPJ WORLD')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) {
          worldSamples.push({
            clock: payload.clock,
            propsPos: toNumArr(payload.propsPos),
            groupWorld: toNumArr(payload.groupWorld),
            containerWorld: toNumArr(payload.containerWorld),
            avatarHeight: typeof payload.avatarHeight === 'number' ? payload.avatarHeight : null
          })
        }
      }
      continue
    }

    // TPJ KEYS { ... }
    if (line.includes('TPJ KEYS')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) keyEvents.push(payload)
      }
      continue
    }

    // TPJ ANIM { ... }
    if (line.includes('TPJ ANIM')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) animEvents.push(payload)
      }
      continue
    }

    // TPJ CLIPS { ... }
    if (line.includes('TPJ CLIPS')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) clipLists.push(payload)
      }
      continue
    }

    // TPJ CAM { ... }
    if (line.includes('TPJ CAM')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) camSamples.push(payload)
      }
      continue
    }

    // TPJ SKEL { ... }
    if (line.includes('TPJ SKEL')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) skelReports.push(payload)
      }
      continue
    }

    // TPJ MESH { ... }
    if (line.includes('TPJ MESH')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) meshReports.push(payload)
      }
      continue
    }

    // NEW: TPJ CRASH_FLOW { ... }
    if (line.includes('TPJ CRASH_FLOW')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) {
          crashFlowEvents.push({
            source: payload.source,
            target: payload.target,
            position: toNumArr(payload.position),
            rotation: toNumArr(payload.rotation),
            moving: payload.moving,
            keys: payload.keys || []
          })
        }
      }
      continue
    }

    // NEW: TPJ CRASH_PROPS { ... }
    if (line.includes('TPJ CRASH_PROPS')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) {
          crashPropsEvents.push({
            avatar: payload.avatar,
            position: toNumArr(payload.position),
            rotation: toNumArr(payload.rotation),
            scale: payload.scale,
            visible: payload.visible,
            moving: payload.moving
          })
        }
      }
      continue
    }

    // NEW: TPJ CRASH_WORLD { ... }
    if (line.includes('TPJ CRASH_WORLD')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) {
          crashWorldEvents.push({
            avatar: payload.avatar,
            frameTime: payload.frameTime,
            localPos: toNumArr(payload.localPos),
            worldPos: toNumArr(payload.worldPos),
            positionChanged: payload.positionChanged,
            rotationChanged: payload.rotationChanged,
            isMoving: payload.isMoving
          })
        }
      }
      continue
    }

    // NEW: Position attempt logs
    if (line.includes('🎯 CRASH POSITION ATTEMPT')) {
      const match = line.match(/🎯 CRASH POSITION ATTEMPT.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) {
          crashPositionAttempts.push({
            propsPosition: toNumArr(payload.propsPosition),
            currentGroupPos: toNumArr(payload.currentGroupPos),
            positionChanged: payload.positionChanged,
            isMoving: payload.isMoving
          })
        }
      }
      continue
    }

    // NEW: Position result logs  
    if (line.includes('✅ CRASH POSITION SET RESULT')) {
      const match = line.match(/✅ CRASH POSITION SET RESULT.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) {
          crashPositionResults.push({
            expected: toNumArr(payload.expected),
            actual: toNumArr(payload.actual),
            match: payload.match
          })
        }
      }
      continue
    }

    // NEW: Position change logs
    if (line.includes('🚀 CRASH POSITION CHANGE DETECTED')) {
      const match = line.match(/🚀 CRASH POSITION CHANGE DETECTED.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) {
          crashPositionChanges.push({
            from: toNumArr(payload.from),
            to: toNumArr(payload.to),
            magnitude: payload.magnitude
          })
        }
      }
      continue
    }

    // NEW: Scaling analysis logs
    if (line.includes('🎯') && line.includes('SCALING ANALYSIS')) {
      const match = line.match(/🎯.*?SCALING ANALYSIS.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) {
          crashScalingAnalysis.push({
            originalHeight: payload.originalHeight,
            normalizedHeight: payload.normalizedHeight,
            normalizedScaleFactor: payload.normalizedScaleFactor,
            scaleMultiplier: payload.scaleMultiplier,
            finalScale: payload.finalScale,
            finalHeight: payload.finalHeight,
            containerScaleBefore: toNumArr(payload.containerScaleBefore)
          })
        }
      }
      continue
    }

    // NEW: Scaling result logs
    if (line.includes('🎯') && line.includes('SCALING RESULT')) {
      const match = line.match(/🎯.*?SCALING RESULT.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) {
          crashScalingResults.push({
            containerScaleAfter: toNumArr(payload.containerScaleAfter),
            scaleX: payload.scaleX,
            scaleY: payload.scaleY,
            scaleZ: payload.scaleZ,
            expectedFinalHeight: payload.expectedFinalHeight
          })
        }
      }
      continue
    }

    // NEW: Avatar execution logs
    if (line.includes('🚨 AVATAR SYSTEM EXECUTING!')) {
      const match = line.match(/🚨 AVATAR SYSTEM EXECUTING!.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) avatarExecutions.push(payload)
      }
      continue
    }

    // JSON: Avatar execution logs
    if (line.includes('TPJ AVATAR_EXEC')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) avatarExecsJson.push(payload)
      }
      continue
    }

    // NEW: Frame start logs
    if (line.includes('🎮 FRAME START:')) {
      const match = line.match(/🎮 FRAME START:.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) frameStarts.push(payload)
      }
      continue
    }

    // NEW: Movement calculation logs
    if (line.includes('🎮 MOVEMENT CALC:')) {
      const match = line.match(/🎮 MOVEMENT CALC:.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) movementCalcs.push(payload)
      }
      continue
    }

    // JSON: Movement calc
    if (line.includes('TPJ MOVE_CALC')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) moveCalcsJson.push(payload)
      }
      continue
    }

    // NEW: Key detection logs
    if (line.includes('🔥 KEY DETECTED:')) {
      keyDetections.push({ line: line.substring(0, 100) })
      continue
    }

    // NEW: Position update logs
    if (line.includes('🚀 POSITION UPDATE:')) {
      const match = line.match(/🚀 POSITION UPDATE:.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) positionUpdates.push(payload)
      }
      continue
    }

    // JSON: Position updates
    if (line.includes('TPJ POSITION_UPDATE')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) posUpdatesJson.push(payload)
      }
      continue
    }

    // NEW: Movement return state logs
    if (line.includes('📤 MOVEMENT RETURN STATE:')) {
      const match = line.match(/📤 MOVEMENT RETURN STATE:.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) movementReturns.push(payload)
      }
      continue
    }

    // JSON: Movement return
    if (line.includes('TPJ MOVE_RETURN')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) moveReturnsJson.push(payload)
      }
      continue
    }

    // NEW: Frame result logs
    if (line.includes('🎮 FRAME RESULT:')) {
      const match = line.match(/🎮 FRAME RESULT:.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) frameResults.push(payload)
      }
      continue
    }

    // JSON: Frame result logs
    if (line.includes('TPJ FRAME_RESULT')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) frameResultsJson.push(payload)
      }
      continue
    }

    // NEW: Movement state update logs
    if (line.includes('🔄 MOVEMENT STATE UPDATED:')) {
      const match = line.match(/🔄 MOVEMENT STATE UPDATED:.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) movementStateUpdates.push(payload)
      }
      continue
    }

    // MODEL SETUP PARSING
    if (line.includes('SETUP_USEEFFECT_START')) {
      const avatar = line.split('SETUP_USEEFFECT_START')[1]?.trim()
      setupUseEffectStarts.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('SETUP_USEEFFECT_END')) {
      const avatar = line.split('SETUP_USEEFFECT_END')[1]?.trim()
      setupUseEffectEnds.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('SETUP_MODEL_START')) {
      const avatar = line.split('SETUP_MODEL_START')[1]?.trim()
      setupModelStarts.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('SETUP_MODEL_END')) {
      const avatar = line.split('SETUP_MODEL_END')[1]?.trim()
      setupModelEnds.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('SETUP_MODEL_PROCEED')) {
      const avatar = line.split('SETUP_MODEL_PROCEED')[1]?.trim()
      setupModelProceeds.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('GROUP_CLEAR_START')) {
      const avatar = line.split('GROUP_CLEAR_START')[1]?.trim()
      groupClears.push({ avatar, phase: 'start', timestamp: Date.now() })
      continue
    }
    if (line.includes('GROUP_CLEAR_END')) {
      const avatar = line.split('GROUP_CLEAR_END')[1]?.trim()
      groupClears.push({ avatar, phase: 'end', timestamp: Date.now() })
      continue
    }
    if (line.includes('MODEL_CLONE_START')) {
      const avatar = line.split('MODEL_CLONE_START')[1]?.trim()
      modelClones.push({ avatar, phase: 'start', timestamp: Date.now() })
      continue
    }
    if (line.includes('MODEL_CLONE_END')) {
      const avatar = line.split('MODEL_CLONE_END')[1]?.trim()
      modelClones.push({ avatar, phase: 'end', timestamp: Date.now() })
      continue
    }
    if (line.includes('MODEL_ANALYZE_START')) {
      const avatar = line.split('MODEL_ANALYZE_START')[1]?.trim()
      modelAnalyzes.push({ avatar, phase: 'start', timestamp: Date.now() })
      continue
    }
    if (line.includes('MODEL_ANALYZE_END')) {
      const avatar = line.split('MODEL_ANALYZE_END')[1]?.trim()
      modelAnalyzes.push({ avatar, phase: 'end', timestamp: Date.now() })
      continue
    }
    if (line.includes('CONTAINER_CREATE_START')) {
      const avatar = line.split('CONTAINER_CREATE_START')[1]?.trim()
      containerCreates.push({ avatar, phase: 'start', timestamp: Date.now() })
      continue
    }
    if (line.includes('CONTAINER_CREATE_END')) {
      const avatar = line.split('CONTAINER_CREATE_END')[1]?.trim()
      containerCreates.push({ avatar, phase: 'end', timestamp: Date.now() })
      continue
    }
    if (line.includes('GROUP_ADD_START')) {
      const avatar = line.split('GROUP_ADD_START')[1]?.trim()
      groupAdds.push({ avatar, phase: 'start', timestamp: Date.now() })
      continue
    }
    if (line.includes('GROUP_ADD_END')) {
      const avatar = line.split('GROUP_ADD_END')[1]?.trim()
      groupAdds.push({ avatar, phase: 'end', timestamp: Date.now() })
      continue
    }
    if (line.includes('GROUP_ADD_SUCCESS')) {
      const avatar = line.split('GROUP_ADD_SUCCESS')[1]?.trim()
      groupAdds.push({ avatar, phase: 'success', timestamp: Date.now() })
      continue
    }
    if (line.includes('GROUP_ADD_FAIL')) {
      const avatar = line.split('GROUP_ADD_FAIL')[1]?.trim()
      groupAdds.push({ avatar, phase: 'fail', timestamp: Date.now() })
      continue
    }
    if (line.includes('SETUP_CLEANUP_START')) {
      const avatar = line.split('SETUP_CLEANUP_START')[1]?.trim()
      setupCleanups.push({ avatar, phase: 'start', timestamp: Date.now() })
      continue
    }
    if (line.includes('SETUP_MODEL_DUPLICATE_BLOCK')) {
      const avatar = line.split('SETUP_MODEL_DUPLICATE_BLOCK')[1]?.trim()
      setupDuplicateBlocks.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('COMPONENT_MOUNT')) {
      const avatar = line.split('COMPONENT_MOUNT')[1]?.trim()
      componentMounts.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('COMPONENT_UNMOUNT')) {
      const avatar = line.split('COMPONENT_UNMOUNT')[1]?.trim()
      componentUnmounts.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('AVATAR_RENDER_START')) {
      const info = line.split('AVATAR_RENDER_START')[1]?.trim()
      avatarRenders.push({ info, timestamp: Date.now() })
      continue
    }
    if (line.includes('PARENT_RENDER_AVATAR')) {
      const avatar = line.split('PARENT_RENDER_AVATAR')[1]?.trim()
      parentRenders.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('SETUPMODEL_DEPS_CHANGED')) {
      const avatar = line.split('SETUPMODEL_DEPS_CHANGED')[1]?.trim()
      setupModelDepsChanges.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('THIRDPERSON_RENDER')) {
      const count = line.split('THIRDPERSON_RENDER')[1]?.trim()
      thirdPersonRenders.push({ count, timestamp: Date.now() })
      continue
    }
    if (line.includes('GAMESTORE_CHECK')) {
      const avatar = line.split('GAMESTORE_CHECK')[1]?.trim()
      gamestoreChecks.push({ avatar, timestamp: Date.now() })
      continue
    }
    if (line.includes('MOVEMENT_STATE_CHANGE')) {
      const info = line.split('MOVEMENT_STATE_CHANGE')[1]?.trim()
      movementStateChanges.push({ info, timestamp: Date.now() })
      continue
    }
    if (line.includes('KEYBOARD_HOOK_CREATE')) {
      const count = line.split('KEYBOARD_HOOK_CREATE')[1]?.trim()
      keyboardHookCreates.push({ count, timestamp: Date.now() })
      continue
    }
    if (line.includes('KEYBOARD_STATE_CHANGE')) {
      const info = line.split('KEYBOARD_STATE_CHANGE')[1]?.trim()
      keyboardStateChanges.push({ info, timestamp: Date.now() })
      continue
    }
    if (line.includes('AVATAR_RENDER_CHECK')) {
      const info = line.split('AVATAR_RENDER_CHECK')[1]?.trim()
      avatarRenderChecks.push({ info, timestamp: Date.now() })
      continue
    }
    if (line.includes('CONDITIONAL_CHECK')) {
      const info = line.split('CONDITIONAL_CHECK')[1]?.trim()
      conditionalChecks.push({ info, timestamp: Date.now() })
      continue
    }

    // ULTRA SIMPLE LOGS - These MUST be captured
    if (line.includes('THIRD_PERSON_FRAME_START')) {
      frameStarts.push({ simple: true })
      continue
    }

    if (line.includes('MOVEMENT_HOOK_CALLED')) {
      movementCalcs.push({ simple: true })
      continue
    }

    if (line.includes('KEYS_ACTIVE')) {
      // Already captured by keyDetections
      continue
    }

    if (line.includes('POSITION_UPDATE_START')) {
      positionUpdates.push({ simple: true })
      continue
    }

    // NEW: Model setup logs
    if (line.includes('SETUP_MODEL_CALLED')) {
      const match = line.match(/SETUP_MODEL_CALLED.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) {
          if (!avatarExecutions.find(e => e.type === 'setup_called')) {
            avatarExecutions.push({ type: 'setup_called', ...payload })
          }
        }
      }
      continue
    }

    if (line.includes('SETUP_MODEL_FAILED_NO_GROUP_REF')) {
      avatarExecutions.push({ type: 'setup_failed', reason: 'no_group_ref' })
      continue
    }

    if (line.includes('SETUP_MODEL_FAILED_NO_AVATAR_MODEL')) {
      avatarExecutions.push({ type: 'setup_failed', reason: 'no_avatar_model' })
      continue
    }

    if (line.includes('SETUP_MODEL_PROCEEDING')) {
      avatarExecutions.push({ type: 'setup_proceeding' })
      continue
    }

    // NEW: Container creation logs
    if (line.includes('CREATING_NORMALIZED_CONTAINER')) {
      const match = line.match(/CREATING_NORMALIZED_CONTAINER.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) avatarExecutions.push({ type: 'container_creating', ...payload })
      }
      continue
    }

    if (line.includes('NORMALIZED_CONTAINER_CREATED')) {
      const match = line.match(/NORMALIZED_CONTAINER_CREATED.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) avatarExecutions.push({ type: 'container_created', ...payload })
      }
      continue
    }

    if (line.includes('ADDING_CONTAINER_TO_GROUP')) {
      const match = line.match(/ADDING_CONTAINER_TO_GROUP.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) avatarExecutions.push({ type: 'adding_to_group', ...payload })
      }
      continue
    }

    if (line.includes('CONTAINER_ADDED_TO_GROUP')) {
      const match = line.match(/CONTAINER_ADDED_TO_GROUP.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) avatarExecutions.push({ type: 'added_to_group', ...payload })
      }
      continue
    }

    // NEW: Avatar render check logs
    if (line.includes('🔍 AVATAR RENDER CHECK:')) {
      const match = line.match(/🔍 AVATAR RENDER CHECK:.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) avatarRenderChecks.push(payload)
      }
      continue
    }

    // JSON: Avatar instance ownership
    if (line.includes('TPJ AVATAR_INSTANCE')) {
      const idx = line.indexOf('{')
      if (idx !== -1) {
        const payload = parseJSONSafe(line.slice(idx))
        if (payload) avatarInstanceLogs.push(payload)
      }
      continue
    }

    // NEW: Group onUpdate debug logs
    if (line.includes('🔍 GROUP_ONUPDATE_DEBUG')) {
      const match = line.match(/🔍 GROUP_ONUPDATE_DEBUG.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) groupOnUpdateDebugLogs.push(payload)
      }
      continue
    }

    // NEW: About to call onMovementChange logs
    if (line.includes('🔄 ABOUT_TO_CALL_ON_MOVEMENT_CHANGE')) {
      aboutToCallOnMovementChangeLogs.push({ timestamp: Date.now() })
      continue
    }

    // NEW: Inside startTransition logs
    if (line.includes('🔄 INSIDE_START_TRANSITION_CALLING_ON_MOVEMENT_CHANGE')) {
      insideStartTransitionLogs.push({ timestamp: Date.now() })
      continue
    }

    // NEW: Result structure debug logs
    if (line.includes('🔍 RESULT_STRUCTURE_DEBUG')) {
      const match = line.match(/🔍 RESULT_STRUCTURE_DEBUG.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) resultStructureDebugLogs.push(payload)
      }
      continue
    }

    // NEW: Update movement errors
    if (line.includes('❌ UPDATE_MOVEMENT_ERROR')) {
      updateMovementErrors.push({ line: line.substring(0, 200) })
      continue
    }

    // NEW: TPJ frame result errors
    if (line.includes('❌ TPJ_FRAME_RESULT_ERROR')) {
      tpjFrameResultErrors.push({ line: line.substring(0, 200) })
      continue
    }

    // NEW: TPJ frame errors
    if (line.includes('❌ TPJ_FRAME_ERROR')) {
      tpjFrameErrors.push({ line: line.substring(0, 200) })
      continue
    }

    // NEW: onStateChange calls
    if (line.includes('🔄 ON_STATE_CHANGE_CALLED')) {
      const match = line.match(/🔄 ON_STATE_CHANGE_CALLED.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) onStateChangeCalls.push(payload)
      }
      continue
    }

    // NEW: setMovementState calls
    if (line.includes('🔄 SET_MOVEMENT_STATE_CALLED')) {
      const match = line.match(/🔄 SET_MOVEMENT_STATE_CALLED.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) setMovementStateCalls.push(payload)
      }
      continue
    }

    // NEW: Avatar props received
    if (line.includes('🔄 AVATAR_PROPS_RECEIVED')) {
      const match = line.match(/🔄 AVATAR_PROPS_RECEIVED.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) avatarPropsReceived.push(payload)
      }
      continue
    }

    // NEW: Avatar frame executions
    if (line.includes('🔄 AVATAR_FRAME_EXEC')) {
      const match = line.match(/🔄 AVATAR_FRAME_EXEC.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) avatarFrameExecs.push(payload)
      }
      continue
    }

    // NEW: useFrame executing checkpoint
    if (line.includes('🔄 USEFRAME_EXECUTING')) {
      useFrameExecuting.push({ timestamp: Date.now() })
      continue
    }

    // NEW: After result structure debug checkpoint
    if (line.includes('🔄 AFTER_RESULT_STRUCTURE_DEBUG')) {
      afterResultStructureDebug.push({ timestamp: Date.now() })
      continue
    }

    // NEW: Camera follower useFrame
    if (line.includes('🎥 CAMERA_FOLLOWER_USEFRAME')) {
      cameraFollowerUseFrame.push({ timestamp: Date.now() })
      continue
    }

    // NEW: Before TPJ frame result
    if (line.includes('🔄 BEFORE_TPJ_FRAME_RESULT')) {
      beforeTpjFrameResult.push({ timestamp: Date.now() })
      continue
    }

    // NEW: After TPJ frame result
    if (line.includes('🔄 AFTER_TPJ_FRAME_RESULT')) {
      afterTpjFrameResult.push({ timestamp: Date.now() })
      continue
    }

    // NEW: Before TPJ frame JSON
    if (line.includes('🔄 BEFORE_TPJ_FRAME_JSON')) {
      beforeTpjFrameJson.push({ timestamp: Date.now() })
      continue
    }

    // NEW: After TPJ frame JSON
    if (line.includes('🔄 AFTER_TPJ_FRAME_JSON')) {
      afterTpjFrameJson.push({ timestamp: Date.now() })
      continue
    }

    // NEW: Scaling verification logs
    if (line.includes('🔍 SCALING VERIFICATION')) {
      const match = line.match(/🔍 SCALING VERIFICATION.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) scalingVerificationLogs.push(payload)
      }
      continue
    }

    // NEW: Scale check logs
    if (line.includes('🔍 SCALE CHECK')) {
      const match = line.match(/🔍 SCALE CHECK.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) scaleCheckLogs.push(payload)
      }
      continue
    }

    // NEW: Other players check logs
    if (line.includes('🔍 OTHER PLAYERS CHECK:')) {
      const match = line.match(/🔍 OTHER PLAYERS CHECK:.*?({.*})/)
      if (match) {
        const payload = parseJSONSafe(match[1])
        if (payload) otherPlayersChecks.push(payload)
      }
      continue
    }

    // NEW: Movement calculation logs
    if (line.includes('🎮 MOVEMENT CALC:')) {
      // Just count them for now
      continue
    }

    // NEW: Key detection logs
    if (line.includes('🔥 KEY DETECTED:')) {
      // Just count them for now
      continue
    }

    // NEW: Position update logs
    if (line.includes('🚀 POSITION UPDATE:')) {
      // Just count them for now
      continue
    }

    // NEW: Movement return state logs
    if (line.includes('📤 MOVEMENT RETURN STATE:')) {
      // Just count them for now
      continue
    }
  }

  // Summaries
  const lastFrame = frames.at(-1)
  const lastContainer = containers.at(-1)
  const lastWorld = worldSamples.at(-1)

  const driftSummary = (() => {
    if (!lastFrame) return null
    const { pos, camTarget } = lastFrame
    // Prefer most recent world sample for accurate group/container positions
    const groupWorld = lastWorld?.groupWorld || lastContainer?.groupWorld || null
    const containerWorld = lastWorld?.containerWorld || lastContainer?.containerWorld || null
    return {
      posVsCamTarget: dist(pos, camTarget),
      posVsGroupWorld: dist(pos, groupWorld),
      posVsContainerWorld: dist(pos, containerWorld),
      groupVsContainer: dist(groupWorld, containerWorld)
    }
  })()

  const totals = {
    frames: frames.length,
    containers: containers.length,
    animStripEvents: animStrips.length,
    worldSamples: worldSamples.length,
    keyEvents: keyEvents.length,
    animEvents: animEvents.length,
    clipLists: clipLists.length,
    camSamples: camSamples.length,
    skelReports: skelReports.length,
    meshReports: meshReports.length,
    // NEW: Crash debugging totals
    crashFlowEvents: crashFlowEvents.length,
    crashPropsEvents: crashPropsEvents.length,
    crashWorldEvents: crashWorldEvents.length,
    crashPositionAttempts: crashPositionAttempts.length,
    crashPositionResults: crashPositionResults.length,
    crashPositionChanges: crashPositionChanges.length,
    crashScalingAnalysis: crashScalingAnalysis.length,
    crashScalingResults: crashScalingResults.length,
    avatarExecutions: avatarExecutions.length,
    avatarRenderChecks: avatarRenderChecks.length,
    avatarInstanceLogs: avatarInstanceLogs.length,
    groupOnUpdateDebugLogs: groupOnUpdateDebugLogs.length,
    aboutToCallOnMovementChangeLogs: aboutToCallOnMovementChangeLogs.length,
    insideStartTransitionLogs: insideStartTransitionLogs.length,
    resultStructureDebugLogs: resultStructureDebugLogs.length,
    updateMovementErrors: updateMovementErrors.length,
    tpjFrameResultErrors: tpjFrameResultErrors.length,
    tpjFrameErrors: tpjFrameErrors.length,
    onStateChangeCalls: onStateChangeCalls.length,
    setMovementStateCalls: setMovementStateCalls.length,
    avatarPropsReceived: avatarPropsReceived.length,
    avatarFrameExecs: avatarFrameExecs.length,
    useFrameExecuting: useFrameExecuting.length,
    afterResultStructureDebug: afterResultStructureDebug.length,
    cameraFollowerUseFrame: cameraFollowerUseFrame.length,
    beforeTpjFrameResult: beforeTpjFrameResult.length,
    afterTpjFrameResult: afterTpjFrameResult.length,
    beforeTpjFrameJson: beforeTpjFrameJson.length,
    afterTpjFrameJson: afterTpjFrameJson.length,
    scalingVerificationLogs: scalingVerificationLogs.length,
    scaleCheckLogs: scaleCheckLogs.length,
    otherPlayersChecks: otherPlayersChecks.length,
    frameStarts: frameStarts.length,
    movementCalcs: movementCalcs.length,
    movementCalcsJson: moveCalcsJson.length,
    keyDetections: keyDetections.length,
    positionUpdates: positionUpdates.length,
    positionUpdatesJson: posUpdatesJson.length,
    movementReturns: movementReturns.length,
    movementReturnsJson: moveReturnsJson.length,
    frameResults: frameResults.length,
    frameResultsJson: frameResultsJson.length,
    movementStateUpdates: movementStateUpdates.length,
    // MODEL SETUP TOTALS
    setupUseEffectStarts: setupUseEffectStarts.length,
    setupUseEffectEnds: setupUseEffectEnds.length,
    setupModelStarts: setupModelStarts.length,
    setupModelEnds: setupModelEnds.length,
    setupModelProceeds: setupModelProceeds.length,
    groupClears: groupClears.length,
    modelClones: modelClones.length,
    modelAnalyzes: modelAnalyzes.length,
    containerCreates: containerCreates.length,
    groupAdds: groupAdds.length,
    setupCleanups: setupCleanups.length,
    setupDuplicateBlocks: setupDuplicateBlocks.length,
    componentMounts: componentMounts.length,
    componentUnmounts: componentUnmounts.length,
    avatarRenders: avatarRenders.length,
    parentRenders: parentRenders.length,
    setupModelDepsChanges: setupModelDepsChanges.length,
    thirdPersonRenders: thirdPersonRenders.length,
    gamestoreChecks: gamestoreChecks.length,
    movementStateChanges: movementStateChanges.length,
    keyboardHookCreates: keyboardHookCreates.length,
    keyboardStateChanges: keyboardStateChanges.length,
    avatarRenderChecks: avatarRenderChecks.length,
    conditionalChecks: conditionalChecks.length
  }

  const movementMismatches = []
  for (let i = 0; i < Math.min(frames.length, containers.length); i++) {
    const f = frames[i]
    const c = containers[i]
    const d = dist(f.pos, c.containerWorld)
    if (d != null && d > 0.1) movementMismatches.push({ index: i, distance: Number(d.toFixed(3)) })
  }

  console.log('===== LOG PARSE SUMMARY =====')
  console.log('Totals:', totals)
  if (driftSummary) console.log('Drift (last sample):', {
    posVsCamTarget: Number((driftSummary.posVsCamTarget || 0).toFixed(3)),
    posVsGroupWorld: Number((driftSummary.posVsGroupWorld || 0).toFixed(3)),
    posVsContainerWorld: Number((driftSummary.posVsContainerWorld || 0).toFixed(3)),
    groupVsContainer: Number((driftSummary.groupVsContainer || 0).toFixed(3))
  })
  if (worldSamples.length > 0) {
    const last = worldSamples.at(-1)
    console.log('World (last):', last)
    const heights = worldSamples.map(w => w.avatarHeight).filter(h => typeof h === 'number')
    if (heights.length > 0) {
      const avgH = heights.reduce((a, b) => a + b, 0) / heights.length
      console.log('Avatar height (avg):', Number(avgH.toFixed(3)))
    }
  }
  if (keyEvents.length > 0) {
    const lastKeys = keyEvents.at(-1)
    console.log('Keys (last):', lastKeys)
  }
  if (animEvents.length > 0) {
    const lastAnim = animEvents.at(-1)
    console.log('Anim (last):', lastAnim)
  }
  if (clipLists.length > 0) {
    const lastClips = clipLists.at(-1)
    console.log('Clips (last):', lastClips)
  }
  if (camSamples.length > 0) {
    const lastCam = camSamples.at(-1)
    console.log('Cam (last):', lastCam)
  }
  if (skelReports.length > 0) {
    const lastSkel = skelReports.at(-1)
    const list = Array.isArray(lastSkel.skinnedMeshes) ? lastSkel.skinnedMeshes : []
    const counts = list.map((s) => ({ name: s && s.name, boneCount: s && s.boneCount }))
    console.log('Skel (last):', { avatar: lastSkel.avatar, counts })
  }
  if (meshReports.length > 0) {
    const lastMesh = meshReports.at(-1)
    const meshList = Array.isArray(lastMesh.meshes) ? lastMesh.meshes : []
    console.log('Meshes (last sample, first 20):', { avatar: lastMesh.avatar, count: meshList.length })
  }

  // Array shape validation summary
  const invalid = { pos: 0, camPos: 0, camTarget: 0, propsPos: 0, groupWorld: 0, containerWorld: 0 }
  for (const f of frames) {
    if (!isVec3(f.pos)) invalid.pos++
    if (f.camPos && !isVec3(f.camPos)) invalid.camPos++
    if (f.camTarget && !isVec3(f.camTarget)) invalid.camTarget++
  }
  for (const w of worldSamples) {
    if (!isVec3(w.propsPos)) invalid.propsPos++
    if (!isVec3(w.groupWorld)) invalid.groupWorld++
    if (!isVec3(w.containerWorld)) invalid.containerWorld++
  }
  console.log('Array shapes (invalid counts):', invalid)
  if (animStrips.length > 0) {
    const last = animStrips.at(-1)
    console.log('Animation strip diagnostics (last):', {
      avatar: last.avatar,
      clips: last.clips,
      originalPositionTrackCount: last.originalPositionTrackCount,
      strippedPositionTrackCount: last.strippedPositionTrackCount
    })
  }
  if (movementMismatches.length > 0) {
    console.log(`Mismatched frames (>0.1 units): ${movementMismatches.length}`)
    console.log(movementMismatches.slice(0, 10))
  } else {
    console.log('No significant mismatches between movement position and container world position.')
  }

  // === NEW CRASH MOVEMENT ANALYSIS ===
  console.log('\n===== MOVEMENT PIPELINE ANALYSIS =====')
  
  // 0. Frame Processing
  console.log('\n0. FRAME PROCESSING:')
  if (frameStarts.length > 0) {
    const lastFrame = frameStarts.at(-1)
    console.log(`  Frame starts: ${frameStarts.length}`)
    console.log(`  Last frame delta: ${lastFrame.delta}`)
    console.log(`  Last frame clock: ${lastFrame.clock}`)
  } else {
    console.log('  ❌ NO FRAME STARTS - useFrame not executing!')
  }

  // 1. Movement Calculations
  console.log('\n1. MOVEMENT CALCULATIONS:')
  if (movementCalcs.length > 0 || moveCalcsJson.length > 0) {
    const total = movementCalcs.length + moveCalcsJson.length
    const lastCalc = (moveCalcsJson.length > 0 ? moveCalcsJson.at(-1) : movementCalcs.at(-1))
    const withKeys = (moveCalcsJson.length > 0 ? moveCalcsJson : movementCalcs).filter((c) => c.hasKeys === true)
    console.log(`  Movement calculations: ${total}`)
    console.log(`  Calculations with keys: ${withKeys.length}`)
    console.log(`  Last calculation has keys: ${lastCalc?.hasKeys}`)
    console.log(`  Last calculation keys: [${Array.isArray(lastCalc?.activeKeys) ? lastCalc.activeKeys.join(', ') : lastCalc?.keysPressed || 'none'}]`)
    console.log(`  Last calculation position: ${Array.isArray(lastCalc?.currentPos) ? lastCalc.currentPos : lastCalc?.currentPos}`)
  } else {
    console.log('  ❌ NO MOVEMENT CALCULATIONS - updateMovement not executing!')
  }

  // 2. Key Detection
  console.log('\n2. KEY DETECTION:')
  if (keyDetections.length > 0) {
    console.log(`  Key detections: ${keyDetections.length}`)
    console.log(`  Last key detection: ${keyDetections.at(-1).line}`)
  } else {
    console.log('  ❌ NO KEY DETECTIONS - Keys not being processed!')
  }

  // 3. Position Updates
  console.log('\n3. POSITION UPDATES:')
  if (positionUpdates.length > 0 || posUpdatesJson.length > 0) {
    const total = positionUpdates.length + posUpdatesJson.length
    const lastUpdate = (posUpdatesJson.length > 0 ? posUpdatesJson.at(-1) : positionUpdates.at(-1))
    console.log(`  Position updates: ${total}`)
    console.log(`  Last update: ${lastUpdate.oldPos} → ${lastUpdate.newPos}`)
    console.log(`  Last update magnitude: ${lastUpdate.magnitude}`)
  } else {
    console.log('  ❌ NO POSITION UPDATES - Position not changing!')
  }

  // 4. Movement Returns
  console.log('\n4. MOVEMENT RETURNS:')
  if (movementReturns.length > 0 || moveReturnsJson.length > 0) {
    const total = movementReturns.length + moveReturnsJson.length
    const lastReturn = (moveReturnsJson.length > 0 ? moveReturnsJson.at(-1) : movementReturns.at(-1))
    console.log(`  Movement returns: ${total}`)
    console.log(`  Last return position: ${lastReturn.position}`)
    console.log(`  Last return isMoving: ${lastReturn.isMoving}`)
    const lastKeys = Array.isArray(lastReturn.activeKeys) ? lastReturn.activeKeys.join(', ') : lastReturn.activeKeys
    console.log(`  Last return keys: ${lastKeys}`)
  } else {
    console.log('  ❌ NO MOVEMENT RETURNS - Hook not returning state!')
  }

  // 5. Frame Results
  console.log('\n5. FRAME RESULTS:')
  if (frameResults.length > 0 || frameResultsJson.length > 0) {
    const total = frameResults.length + frameResultsJson.length
    const lastObj = (frameResultsJson.length > 0 ? frameResultsJson.at(-1) : frameResults.at(-1))
    console.log(`  Frame results: ${total}`)
    console.log(`  Last result position: ${lastObj?.position}`)
    console.log(`  Last result isMoving: ${lastObj?.isMoving}`)
    const lastKeys = Array.isArray(lastObj?.activeKeys) ? lastObj.activeKeys.join(', ') : lastObj?.activeKeys
    console.log(`  Last result keys: ${lastKeys}`)
  } else {
    console.log('  ❌ NO FRAME RESULTS - ThirdPersonMovementController not working!')
  }

  // 6. Movement State Updates
  console.log('\n6. MOVEMENT STATE UPDATES:')
  if (movementStateUpdates.length > 0) {
    const lastStateUpdate = movementStateUpdates.at(-1)
    console.log(`  State updates: ${movementStateUpdates.length}`)
    console.log(`  Last state position: ${lastStateUpdate.position}`)
    console.log(`  Last state isMoving: ${lastStateUpdate.isMoving}`)
    console.log(`  Last state keys: ${lastStateUpdate.activeKeys}`)
  } else {
    console.log('  ❌ NO STATE UPDATES - onStateChange not being called!')
  }

  console.log('\n===== AVATAR SYSTEM ANALYSIS =====')
  
  // 7. Avatar System Execution Check
  console.log('\n7. AVATAR SYSTEM EXECUTION:')
  if (avatarExecutions.length > 0 || avatarExecsJson.length > 0) {
    const setupCalled = avatarExecutions.filter(e => e.type === 'setup_called')
    const setupFailed = avatarExecutions.filter(e => e.type === 'setup_failed')
    const setupProceeding = avatarExecutions.filter(e => e.type === 'setup_proceeding')
    const regularExecutions = avatarExecutions.filter(e => !e.type)
    const jsonExecs = avatarExecsJson
    
    console.log(`  Avatar systems executed: ${avatarExecutions.length} logs, ${jsonExecs.length} json`)
    console.log(`  Setup called: ${setupCalled.length}`)
    console.log(`  Setup failed: ${setupFailed.length}`)
    console.log(`  Setup proceeding: ${setupProceeding.length}`)
    console.log(`  Regular executions: ${regularExecutions.length}`)
    
    if (setupCalled.length > 0) {
      const lastSetup = setupCalled.at(-1)
      console.log(`  Last setup call:`)
      console.log(`    Has group ref: ${lastSetup.hasGroupRef}`)
      console.log(`    Has avatar model: ${lastSetup.hasAvatarModel}`)
      console.log(`    Avatar name: ${lastSetup.avatarName}`)
    }
    
    
    if (setupFailed.length > 0) {
      const failures = setupFailed.map(f => f.reason)
      console.log(`  Setup failures: [${failures.join(', ')}]`)
    }
    
    if (regularExecutions.length > 0) {
      const lastExecution = regularExecutions.at(-1)
      console.log(`  Last regular execution: ${lastExecution.avatar} at ${lastExecution.timestamp}`)
      console.log(`  Last execution position: ${lastExecution.position}`)
      console.log(`  Last execution isMoving: ${lastExecution.isMoving}`)
    }
    
    // Container diagnostics
    const containerCreating = avatarExecutions.filter(e => e.type === 'container_creating')
    const containerCreated = avatarExecutions.filter(e => e.type === 'container_created')
    const addingToGroup = avatarExecutions.filter(e => e.type === 'adding_to_group')
    const addedToGroup = avatarExecutions.filter(e => e.type === 'added_to_group')
    
    if (containerCreating.length > 0 || containerCreated.length > 0 || addingToGroup.length > 0 || addedToGroup.length > 0) {
      console.log(`\n  CONTAINER DIAGNOSTICS:`)
      console.log(`    Container creating: ${containerCreating.length}`)
      console.log(`    Container created: ${containerCreated.length}`)
      console.log(`    Adding to group: ${addingToGroup.length}`)
      console.log(`    Added to group: ${addedToGroup.length}`)
      
      if (containerCreated.length > 0) {
        const lastCreated = containerCreated.at(-1)
        console.log(`    Last container scale: ${lastCreated.containerScale}`)
        console.log(`    Last container children: ${lastCreated.containerChildren}`)
        console.log(`    Pivot exists: ${lastCreated.pivotExists}`)
      }
      
      if (addedToGroup.length > 0) {
        const lastAdded = addedToGroup.at(-1)
        console.log(`    Group children after add: ${lastAdded.groupChildren}`)
        console.log(`    Group child names: [${lastAdded.groupChildNames?.join(', ') || 'none'}]`)
      }
    }
  } else {
    console.log('  ❌ NO AVATAR SYSTEMS EXECUTED - Components not rendering!')
  }
  
  if (avatarRenderChecks.length > 0) {
    const lastCheck = avatarRenderChecks.at(-1)
    console.log(`  Render checks: ${avatarRenderChecks.length}`)
    console.log(`  Current player exists: ${lastCheck.currentPlayerExists}`)
    console.log(`  Avatar exists: ${lastCheck.avatarExists}`)
    console.log(`  About to render: ${lastCheck.aboutToRenderAvatar}`)
  } else {
    console.log('  ❌ NO RENDER CHECKS - View component not executing!')
  }
  
  if (otherPlayersChecks.length > 0) {
    const lastOtherCheck = otherPlayersChecks.at(-1)
    console.log(`  Other players count: ${lastOtherCheck.otherPlayersCount}`)
  }

  // Instance ownership summary
  if (avatarInstanceLogs.length > 0) {
    const primaries = avatarInstanceLogs.filter(l => l.status === 'primary_registered').length
    const blocks = avatarInstanceLogs.filter(l => l.status === 'duplicate_blocked').length
    const unreg = avatarInstanceLogs.filter(l => l.status === 'primary_unregistered').length
    console.log(`\n  AVATAR INSTANCE OWNERSHIP:`)
    console.log(`    Primary registered: ${primaries}`)
    console.log(`    Duplicate blocked: ${blocks}`)
    console.log(`    Primary unregistered: ${unreg}`)
  }

  // Group onUpdate debug summary
  if (groupOnUpdateDebugLogs.length > 0) {
    const lastDebug = groupOnUpdateDebugLogs.at(-1)
    console.log(`\n  GROUP ONUPDATE DEBUG:`)
    console.log(`    Debug logs: ${groupOnUpdateDebugLogs.length}`)
    console.log(`    Last: selfExists=${lastDebug.selfExists}, avatarModelExists=${lastDebug.avatarModelExists}`)
    console.log(`    Last: hasSetupRun=${lastDebug.hasSetupRun}, groupRefCurrent=${lastDebug.groupRefCurrent}`)
    console.log(`    Last: selfIsSameAsGroupRef=${lastDebug.selfIsSameAsGroupRef}`)
  }

  // Movement state callback debug summary
  if (aboutToCallOnMovementChangeLogs.length > 0 || insideStartTransitionLogs.length > 0) {
    console.log(`\n  MOVEMENT STATE CALLBACK DEBUG:`)
    console.log(`    About to call onMovementChange: ${aboutToCallOnMovementChangeLogs.length}`)
    console.log(`    Inside startTransition calls: ${insideStartTransitionLogs.length}`)
    
    if (aboutToCallOnMovementChangeLogs.length > 0) {
      const lastCall = aboutToCallOnMovementChangeLogs.at(-1)
      console.log(`    Last call: hasOnMovementChange=${lastCall.hasOnMovementChange}, resultExists=${lastCall.resultExists}`)
      console.log(`    Last call: resultIsMoving=${lastCall.resultIsMoving}`)
    }
  }

  // Result structure debug summary
  if (resultStructureDebugLogs.length > 0) {
    const lastResult = resultStructureDebugLogs.at(-1)
    console.log(`\n  RESULT STRUCTURE DEBUG:`)
    console.log(`    Structure debug logs: ${resultStructureDebugLogs.length}`)
    console.log(`    Last: resultExists=${lastResult.resultExists}, resultType=${lastResult.resultType}`)
    console.log(`    Last: hasPosition=${lastResult.hasPosition}, hasVelocity=${lastResult.hasVelocity}`)
    console.log(`    Last: hasActiveKeys=${lastResult.hasActiveKeys}`)
    console.log(`    Last: resultKeys=[${lastResult.resultKeys?.join(', ') || 'none'}]`)
  }

  // Error summary
  if (updateMovementErrors.length > 0 || tpjFrameResultErrors.length > 0 || tpjFrameErrors.length > 0) {
    console.log(`\n  ERROR SUMMARY:`)
    console.log(`    Update movement errors: ${updateMovementErrors.length}`)
    console.log(`    TPJ frame result errors: ${tpjFrameResultErrors.length}`)
    console.log(`    TPJ frame errors: ${tpjFrameErrors.length}`)
    
    if (updateMovementErrors.length > 0) {
      console.log(`    Last update movement error: ${updateMovementErrors.at(-1).line}`)
    }
    if (tpjFrameResultErrors.length > 0) {
      console.log(`    Last TPJ frame result error: ${tpjFrameResultErrors.at(-1).line}`)
    }
    if (tpjFrameErrors.length > 0) {
      console.log(`    Last TPJ frame error: ${tpjFrameErrors.at(-1).line}`)
    }
  }

  // Flow analysis summary
  console.log(`\n  MOVEMENT FLOW ANALYSIS:`)
  console.log(`    Movement controller useFrame: ${useFrameExecuting.length}`)
  console.log(`    Camera follower useFrame: ${cameraFollowerUseFrame.length}`)
  console.log(`    After result structure debug: ${afterResultStructureDebug.length}`)
  console.log(`    Before TPJ frame result: ${beforeTpjFrameResult.length}`)
  console.log(`    After TPJ frame result: ${afterTpjFrameResult.length}`)
  console.log(`    Before TPJ frame JSON: ${beforeTpjFrameJson.length}`)
  console.log(`    After TPJ frame JSON: ${afterTpjFrameJson.length}`)
  console.log(`    About to call onMovementChange: ${aboutToCallOnMovementChangeLogs.length}`)
  console.log(`    onStateChange calls: ${onStateChangeCalls.length}`)
  console.log(`    setMovementState calls: ${setMovementStateCalls.length}`)
  console.log(`    Avatar props received: ${avatarPropsReceived.length}`)
  console.log(`    Avatar frame executions: ${avatarFrameExecs.length}`)
  
  if (onStateChangeCalls.length > 0) {
    const lastStateChange = onStateChangeCalls.at(-1)
    console.log(`    Last onStateChange: pos=[${lastStateChange.position.join(', ')}], moving=${lastStateChange.isMoving}`)
  }
  
  if (setMovementStateCalls.length > 0) {
    const lastSetState = setMovementStateCalls.at(-1)
    console.log(`    Last setMovementState: pos=[${lastSetState.position.join(', ')}], moving=${lastSetState.isMoving}`)
  }
  
  if (avatarPropsReceived.length > 0) {
    const lastProps = avatarPropsReceived.at(-1)
    console.log(`    Last avatar props: pos=[${lastProps.position.join(', ')}], moving=${lastProps.isMoving}`)
  }
  
  if (avatarFrameExecs.length > 0) {
    const lastFrame = avatarFrameExecs.at(-1)
    console.log(`    Last avatar frame: pos=[${lastFrame.position.join(', ')}], moving=${lastFrame.isMoving}`)
  }
  
  // Flow consistency check
  const flowIssues = []
  if (useFrameExecuting.length === 0) flowIssues.push('Movement controller useFrame not executing')
  if (cameraFollowerUseFrame.length === 0) flowIssues.push('Camera follower useFrame not executing')
  if (afterResultStructureDebug.length === 0) flowIssues.push('Failing before result structure debug')
  if (onStateChangeCalls.length === 0) flowIssues.push('No onStateChange calls')
  if (setMovementStateCalls.length === 0) flowIssues.push('No setMovementState calls')
  if (avatarPropsReceived.length === 0) flowIssues.push('No avatar props received')
  if (avatarFrameExecs.length === 0) flowIssues.push('No avatar frame executions')
  
  if (flowIssues.length > 0) {
    console.log(`    ❌ FLOW ISSUES: ${flowIssues.join(', ')}`)
  } else {
    console.log(`    ✅ COMPLETE FLOW: Movement state reaching avatar system`)
  }

  // Scaling analysis
  console.log(`\n  SCALING DEBUG ANALYSIS:`)
  console.log(`    Scaling verification logs: ${scalingVerificationLogs.length}`)
  console.log(`    Scale check logs: ${scaleCheckLogs.length}`)
  
  if (scalingVerificationLogs.length > 0) {
    const lastVerification = scalingVerificationLogs.at(-1)
    console.log(`    Last scaling verification:`)
    console.log(`      Expected height: ${lastVerification.expectedHeight}`)
    console.log(`      Actual height: ${lastVerification.actualHeight}`)
    console.log(`      Scaling worked: ${lastVerification.scalingWorked}`)
    if (lastVerification.boundingBox) {
      console.log(`      Bounding box: min=${lastVerification.boundingBox.min.join(',')}, max=${lastVerification.boundingBox.max.join(',')}`)
    }
  }
  
  if (scaleCheckLogs.length > 0) {
    const lastScaleCheck = scaleCheckLogs.at(-1)
    console.log(`    Last scale check:`)
    console.log(`      Group scale: [${lastScaleCheck.groupScale.join(', ')}]`)
    console.log(`      Children count: ${lastScaleCheck.childrenCount}`)
    console.log(`      First child scale: ${lastScaleCheck.firstChildScale}`)
  }

  console.log('\n===== MODEL SETUP ANALYSIS =====')
  
  // Model Setup Pipeline Analysis
  console.log('\n8. MODEL SETUP PIPELINE:')
  console.log(`  useEffect starts: ${setupUseEffectStarts.length}`)
  console.log(`  useEffect ends: ${setupUseEffectEnds.length}`)
  console.log(`  setupModel starts: ${setupModelStarts.length}`)
  console.log(`  setupModel ends: ${setupModelEnds.length}`)
  console.log(`  setupModel proceeds: ${setupModelProceeds.length}`)
  console.log(`  Group clears: ${groupClears.length}`)
  console.log(`  Model clones: ${modelClones.length}`)
  console.log(`  Model analyzes: ${modelAnalyzes.length}`)
  console.log(`  Container creates: ${containerCreates.length}`)
  console.log(`  Group adds: ${groupAdds.length}`)
  console.log(`  Setup cleanups: ${setupCleanups.length}`)
  console.log(`  Duplicate blocks: ${setupDuplicateBlocks.length}`)
  console.log(`  Component mounts: ${componentMounts.length}`)
  console.log(`  Component unmounts: ${componentUnmounts.length}`)
  console.log(`  Avatar renders: ${avatarRenders.length}`)
  console.log(`  Parent renders: ${parentRenders.length}`)
  console.log(`  SetupModel deps changes: ${setupModelDepsChanges.length}`)
  
  // Setup Flow Analysis
  console.log('\n9. SETUP FLOW ANALYSIS:')
  const setupRatio = setupModelStarts.length > 0 ? (setupModelEnds.length / setupModelStarts.length * 100).toFixed(1) : 'N/A'
  const containerRatio = containerCreates.length > 0 ? (groupAdds.filter(g => g.phase === 'success').length / containerCreates.length * 100).toFixed(1) : 'N/A'
  
  console.log(`  Setup completion rate: ${setupRatio}% (${setupModelEnds.length}/${setupModelStarts.length})`)
  console.log(`  Container add success rate: ${containerRatio}% (${groupAdds.filter(g => g.phase === 'success').length}/${containerCreates.length})`)
  
  if (setupUseEffectStarts.length > 1) {
    console.log(`  ⚠️  MULTIPLE USEEFFECT STARTS: ${setupUseEffectStarts.length} (should be 1)`)
  }
  if (setupModelStarts.length > 1) {
    console.log(`  ⚠️  MULTIPLE SETUP_MODEL CALLS: ${setupModelStarts.length} (should be 1)`)
  }
  if (setupDuplicateBlocks.length > 0) {
    console.log(`  ✅ DUPLICATE EXECUTIONS BLOCKED: ${setupDuplicateBlocks.length}`)
  }
  if (setupModelDepsChanges.length > 0) {
    console.log(`  ⚠️  SETUPMODEL DEPENDENCIES CHANGED: ${setupModelDepsChanges.length} times`)
  }
  
  // Component Lifecycle Analysis
  console.log('\n11. COMPONENT LIFECYCLE ANALYSIS:')
  console.log(`  Component mounts: ${componentMounts.length}`)
  console.log(`  Component unmounts: ${componentUnmounts.length}`)
  console.log(`  Avatar renders: ${avatarRenders.length}`)
  console.log(`  Parent renders: ${parentRenders.length}`)
  
  if (componentMounts.length > 1) {
    console.log(`  ⚠️  MULTIPLE COMPONENT MOUNTS: ${componentMounts.length} (should be 1)`)
  }
  if (componentUnmounts.length > 0) {
    console.log(`  ⚠️  COMPONENT UNMOUNTED: ${componentUnmounts.length} times`)
  }
  if (avatarRenders.length > parentRenders.length * 2) {
    console.log(`  ⚠️  EXCESSIVE AVATAR RENDERS: ${avatarRenders.length} renders vs ${parentRenders.length} parent renders`)
  }
  
  // Parent Component Analysis
  console.log('\n12. PARENT COMPONENT ANALYSIS:')
  console.log(`  ThirdPerson renders: ${thirdPersonRenders.length}`)
  console.log(`  GameStore checks: ${gamestoreChecks.length}`)
  console.log(`  Movement state changes: ${movementStateChanges.length}`)
  console.log(`  Keyboard hook creates: ${keyboardHookCreates.length}`)
  console.log(`  Keyboard state changes: ${keyboardStateChanges.length}`)
  console.log(`  Avatar render checks: ${avatarRenderChecks.length}`)
  console.log(`  Conditional checks: ${conditionalChecks.length}`)
  
  if (thirdPersonRenders.length > 10) {
    console.log(`  ⚠️  EXCESSIVE THIRDPERSON RENDERS: ${thirdPersonRenders.length}`)
  }
  if (keyboardHookCreates.length > 1) {
    console.log(`  ⚠️  MULTIPLE KEYBOARD HOOK CREATES: ${keyboardHookCreates.length} (should be 1)`)
  }
  if (avatarRenderChecks.length !== conditionalChecks.length) {
    console.log(`  ⚠️  RENDER CHECK MISMATCH: ${avatarRenderChecks.length} checks vs ${conditionalChecks.length} conditionals`)
  }
  
  // Latest Setup Events
  console.log('\n10. LATEST SETUP EVENTS:')
  if (setupUseEffectStarts.length > 0) {
    const latest = setupUseEffectStarts[setupUseEffectStarts.length - 1]
    console.log(`  Last useEffect start: ${latest.avatar}`)
  }
  if (groupAdds.length > 0) {
    const latest = groupAdds[groupAdds.length - 1]
    console.log(`  Last group add: ${latest.avatar} (${latest.phase})`)
  }
  
  console.log('\n===== CRASH MOVEMENT ANALYSIS =====')

  // 1. Data Pipeline Analysis
  console.log('\n1. DATA PIPELINE:')
  const lastFlow = crashFlowEvents.at(-1)
  const lastProps = crashPropsEvents.at(-1)
  const lastCrashWorld = crashWorldEvents.at(-1)
  
  if (lastFlow) {
    console.log('  Flow (ThirdPersonView → ModernAvatarSystem):')
    console.log(`    Position: [${lastFlow.position?.map(n => n.toFixed(3)).join(', ') || 'null'}]`)
    console.log(`    Moving: ${lastFlow.moving}`)
    console.log(`    Keys: [${lastFlow.keys?.join(', ') || 'none'}]`)
  } else {
    console.log('  ❌ NO FLOW DATA - Position not being sent to avatar system!')
  }

  if (lastProps) {
    console.log('  Props (received by ModernAvatarSystem):')
    console.log(`    Position: [${lastProps.position?.map(n => n.toFixed(3)).join(', ') || 'null'}]`)
    console.log(`    Moving: ${lastProps.moving}`)
    console.log(`    Scale: ${lastProps.scale}`)
  } else {
    console.log('  ❌ NO PROPS DATA - Avatar system not receiving props!')
  }

  if (lastCrashWorld) {
    console.log('  World (3D object positions):')
    console.log(`    Local Pos: [${lastCrashWorld.localPos?.map(n => n.toFixed(3)).join(', ') || 'null'}]`)
    console.log(`    World Pos: [${lastCrashWorld.worldPos?.map(n => n.toFixed(3)).join(', ') || 'null'}]`)
    console.log(`    Position Changed: ${lastCrashWorld.positionChanged}`)
  } else {
    console.log('  ❌ NO WORLD DATA - 3D object position not being tracked!')
  }

  // 2. Position Update Detection
  console.log('\n2. POSITION UPDATE ANALYSIS:')
  const positionChanges = crashWorldEvents.filter(e => e.positionChanged === true)
  const totalCrashFrames = crashWorldEvents.length
  const movingFrames = crashWorldEvents.filter(e => e.isMoving === true).length
  
  console.log(`  Total frames logged: ${totalCrashFrames}`)
  console.log(`  Frames with isMoving=true: ${movingFrames}`)
  console.log(`  Frames with position changes: ${positionChanges.length}`)
  console.log(`  Position update rate: ${totalCrashFrames > 0 ? ((positionChanges.length / totalCrashFrames) * 100).toFixed(1) : 0}%`)
  
  console.log(`  Position attempts: ${crashPositionAttempts.length}`)
  console.log(`  Position set results: ${crashPositionResults.length}`)
  console.log(`  Position change detections: ${crashPositionChanges.length}`)
  
  const failedSets = crashPositionResults.filter(r => !r.match)
  console.log(`  Failed position sets: ${failedSets.length} / ${crashPositionResults.length}`)

  // 3. Position Consistency Check
  console.log('\n3. POSITION CONSISTENCY:')
  const lastAttempt = crashPositionAttempts.at(-1)
  const lastResult = crashPositionResults.at(-1)
  
  if (lastFlow && lastProps && lastCrashWorld) {
    const flowPos = lastFlow.position || [0, 0, 0]
    const propsPos = lastProps.position || [0, 0, 0]
    const localPos = lastCrashWorld.localPos || [0, 0, 0]
    const worldPos = lastCrashWorld.worldPos || [0, 0, 0]

    const flowToProps = dist(flowPos, propsPos)
    const propsToLocal = dist(propsPos, localPos)
    const localToWorld = dist(localPos, worldPos)

    console.log(`  Flow → Props distance: ${flowToProps?.toFixed(4) || 'N/A'} ${flowToProps && flowToProps > 0.001 ? '❌ MISMATCH' : '✅'}`)
    console.log(`  Props → Local distance: ${propsToLocal?.toFixed(4) || 'N/A'} ${propsToLocal && propsToLocal > 0.001 ? '❌ MISMATCH' : '✅'}`)
    console.log(`  Local → World distance: ${localToWorld?.toFixed(4) || 'N/A'} ${localToWorld && localToWorld > 0.001 ? '❌ MISMATCH' : '✅'}`)
    
    if (lastAttempt) {
      console.log(`  Position attempt vs props: ${dist(lastAttempt.propsPosition, propsPos)?.toFixed(4) || 'N/A'}`)
    }
    
    if (lastResult) {
      console.log(`  Position set successful: ${lastResult.match ? '✅ YES' : '❌ NO'}`)
      if (!lastResult.match) {
        console.log(`    Expected: [${lastResult.expected?.map(n => n.toFixed(3)).join(', ') || 'null'}]`)
        console.log(`    Actual: [${lastResult.actual?.map(n => n.toFixed(3)).join(', ') || 'null'}]`)
      }
    }
  } else {
    console.log('  ❌ INCOMPLETE DATA - Cannot verify position consistency')
  }

  // 4. Movement Activity
  console.log('\n4. MOVEMENT ACTIVITY:')
  const recentCrashEvents = crashWorldEvents.slice(-10)
  if (recentCrashEvents.length > 0) {
    const positions = recentCrashEvents.map(e => e.worldPos).filter(Boolean)
    if (positions.length >= 2) {
      const totalDistance = positions.slice(1).reduce((acc, pos, i) => {
        const d = dist(positions[i], pos)
        return acc + (d || 0)
      }, 0)
      console.log(`  Distance traveled (last 10 frames): ${totalDistance.toFixed(3)} units`)
      console.log(`  Average distance per frame: ${(totalDistance / (positions.length - 1)).toFixed(4)} units`)
      console.log(`  Moving: ${totalDistance > 0.01 ? '✅ YES' : '❌ NO'}`)
    } else {
      console.log('  ❌ Insufficient position data for movement analysis')
    }
  } else {
    console.log('  ❌ No recent crash events to analyze')
  }

  // 5. Key Diagnostics
  console.log('\n5. KEY DIAGNOSTICS:')
  const flowEventsWithKeys = crashFlowEvents.filter(e => e.keys && e.keys.length > 0)
  const propsEventsMoving = crashPropsEvents.filter(e => e.moving === true)
  const worldEventsMoving = crashWorldEvents.filter(e => e.isMoving === true)

  console.log(`  Flow events with active keys: ${flowEventsWithKeys.length}`)
  console.log(`  Props events marked as moving: ${propsEventsMoving.length}`)
  console.log(`  World events marked as moving: ${worldEventsMoving.length}`)

  if (flowEventsWithKeys.length > 0 && worldEventsMoving.length === 0) {
    console.log('  ❌ CRITICAL: Keys detected but world position not updating!')
  }

  // 6. Scale Analysis
  console.log('\n6. SCALE ANALYSIS:')
  const scaleValues = crashPropsEvents.map(e => e.scale).filter(s => typeof s === 'number')
  if (scaleValues.length > 0) {
    const avgScale = scaleValues.reduce((a, b) => a + b, 0) / scaleValues.length
    console.log(`  Average scale: ${avgScale.toFixed(4)}`)
    console.log(`  Scale range: ${Math.min(...scaleValues)} - ${Math.max(...scaleValues)}`)
    console.log(`  Scale status: ${avgScale < 0.1 ? '⚠️ VERY SMALL' : avgScale > 10 ? '⚠️ VERY LARGE' : '✅ REASONABLE'}`)
  }

  // 7. Detailed Scaling Analysis
  console.log('\n7. DETAILED SCALING ANALYSIS:')
  const lastScalingAnalysis = crashScalingAnalysis.at(-1)
  const lastScalingResult = crashScalingResults.at(-1)
  
  if (lastScalingAnalysis) {
    console.log('  Scaling calculation:')
    console.log(`    Original height: ${lastScalingAnalysis.originalHeight?.toFixed(3) || 'N/A'} units`)
    console.log(`    Normalized scale factor: ${lastScalingAnalysis.normalizedScaleFactor?.toFixed(6) || 'N/A'}`)
    console.log(`    Scale multiplier (prop): ${lastScalingAnalysis.scaleMultiplier?.toFixed(6) || 'N/A'}`)
    console.log(`    Final scale: ${lastScalingAnalysis.finalScale?.toFixed(6) || 'N/A'}`)
    console.log(`    Expected final height: ${lastScalingAnalysis.finalHeight?.toFixed(6) || 'N/A'} units`)
    
    if (lastScalingResult) {
      console.log('  Applied scale:')
      console.log(`    Container scale: [${lastScalingResult.containerScaleAfter?.map(n => n.toFixed(6)).join(', ') || 'N/A'}]`)
      console.log(`    Expected vs actual height: ${lastScalingAnalysis.finalHeight?.toFixed(6) || 'N/A'} vs ${lastScalingResult.expectedFinalHeight?.toFixed(6) || 'N/A'}`)
      
      const heightInMeters = lastScalingResult.expectedFinalHeight
      if (typeof heightInMeters === 'number') {
        if (heightInMeters > 100) {
          console.log(`    Size status: 🦖 KAIJU SIZE (${heightInMeters.toFixed(1)}m = ${(heightInMeters * 3.28).toFixed(0)}ft tall)`)
        } else if (heightInMeters > 10) {
          console.log(`    Size status: 🏢 BUILDING SIZE (${heightInMeters.toFixed(1)}m = ${(heightInMeters * 3.28).toFixed(0)}ft tall)`)
        } else if (heightInMeters > 2) {
          console.log(`    Size status: 👤 HUMAN SCALE (${heightInMeters.toFixed(2)}m = ${(heightInMeters * 3.28).toFixed(1)}ft tall)`)
        } else if (heightInMeters > 0.01) {
          console.log(`    Size status: 🐭 TOY SIZE (${(heightInMeters * 100).toFixed(1)}cm = ${(heightInMeters * 39.37).toFixed(1)}in tall)`)
        } else {
          console.log(`    Size status: 🔬 MICROSCOPIC (${(heightInMeters * 1000).toFixed(2)}mm = ${(heightInMeters * 39370).toFixed(0)}mils tall)`)
        }
      }
    }
  } else {
    console.log('  ❌ NO SCALING ANALYSIS DATA')
  }

  console.log('\n===== END CRASH ANALYSIS =====')
}

main()


