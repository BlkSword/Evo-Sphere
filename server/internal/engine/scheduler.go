package engine

import (
	"sync"
	"sync/atomic"
	"time"
)

// SchedulerState represents the scheduler state
type SchedulerState int32

const (
	SchedulerStopped SchedulerState = iota
	SchedulerRunning
	SchedulerPaused
)

// Scheduler manages the evolution loop
type Scheduler struct {
	universe      *Universe
	tickInterval  time.Duration
	state         atomic.Int32
	onTick        func(diffs []CellDiff, generation, population uint32)
	onReset       func() // 新增：重置回调
	tickChan      chan struct{}
	mu            sync.RWMutex
	maxGeneration uint32 // 到达此代数后自动重置
}

// NewScheduler creates a new scheduler
func NewScheduler(universe *Universe, tickInterval time.Duration) *Scheduler {
	s := &Scheduler{
		universe:      universe,
		tickInterval:  tickInterval,
		tickChan:      make(chan struct{}, 1),
		maxGeneration: 300, // 300代后自动重置
	}
	s.state.Store(int32(SchedulerStopped))
	return s
}

// SetOnReset sets the reset callback
func (s *Scheduler) SetOnReset(callback func()) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.onReset = callback
}

// Start starts the evolution loop
func (s *Scheduler) Start(onTick func(diffs []CellDiff, generation, population uint32)) {
	s.mu.Lock()
	s.onTick = onTick
	s.mu.Unlock()

	if s.state.Load() == int32(SchedulerRunning) {
		return
	}

	s.state.Store(int32(SchedulerRunning))
	go s.tickLoop()
}

// Stop stops the evolution loop
func (s *Scheduler) Stop() {
	s.state.Store(int32(SchedulerStopped))
}

// Pause pauses the evolution
func (s *Scheduler) Pause() {
	s.state.Store(int32(SchedulerPaused))
}

// Resume resumes the evolution
func (s *Scheduler) Resume() {
	s.state.Store(int32(SchedulerRunning))
	s.signalTick()
}

// TogglePause toggles pause state and returns true if now paused
func (s *Scheduler) TogglePause() bool {
	currentState := SchedulerState(s.state.Load())
	if currentState == SchedulerPaused {
		s.state.Store(int32(SchedulerRunning))
		s.signalTick()
		return false
	} else if currentState == SchedulerRunning {
		s.state.Store(int32(SchedulerPaused))
		return true
	}
	return false
}

// SetTickInterval sets the tick interval
func (s *Scheduler) SetTickInterval(interval time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tickInterval = interval
}

// Step performs a single step (for paused mode)
func (s *Scheduler) Step() []CellDiff {
	if s.state.Load() == int32(SchedulerRunning) {
		return nil
	}
	return s.universe.NextGeneration()
}

// State returns the current scheduler state
func (s *Scheduler) State() SchedulerState {
	return SchedulerState(s.state.Load())
}

// IsPaused returns true if paused
func (s *Scheduler) IsPaused() bool {
	return s.state.Load() == int32(SchedulerPaused)
}

// tickLoop is the main evolution loop
func (s *Scheduler) tickLoop() {
	ticker := time.NewTicker(s.tickInterval)
	defer ticker.Stop()

	for {
		state := SchedulerState(s.state.Load())
		if state == SchedulerStopped {
			return
		}

		if state == SchedulerPaused {
			time.Sleep(50 * time.Millisecond)
			continue
		}

		select {
		case <-ticker.C:
			s.mu.Lock()
			ticker.Reset(s.tickInterval)
			s.mu.Unlock()

			s.tick()

		case <-s.tickChan:
			s.tick()
		}
	}
}

func (s *Scheduler) tick() {
	// 检查是否需要自动重置
	if s.universe.Generation() >= s.maxGeneration {
		s.universe.Clear()
		s.universe.Randomize(0.15, 500, 500, 250) // 1000x1000 世界中心区域
		s.universe.generation.Store(0)

		// 调用重置回调
		s.mu.RLock()
		onReset := s.onReset
		s.mu.RUnlock()

		if onReset != nil {
			onReset()
		}
		return
	}

	diffs := s.universe.NextGeneration()
	s.mu.RLock()
	onTick := s.onTick
	s.mu.RUnlock()

	if onTick != nil && len(diffs) > 0 {
		onTick(diffs, s.universe.Generation(), s.universe.Population())
	}
}

func (s *Scheduler) signalTick() {
	select {
	case s.tickChan <- struct{}{}:
	default:
	}
}
