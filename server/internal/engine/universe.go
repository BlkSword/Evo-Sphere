package engine

import (
	"sync"
	"sync/atomic"
)

// Universe represents the game world
type Universe struct {
	mu         sync.RWMutex
	activeList *ActiveList
	generation atomic.Uint32
	population atomic.Uint32
	worldSize  int32
}

// UniverseConfig holds universe configuration
type UniverseConfig struct {
	WorldSize int32
}

// NewUniverse creates a new universe
func NewUniverse() *Universe {
	return NewUniverseWithConfig(UniverseConfig{WorldSize: 1000})
}

// NewUniverseWithConfig creates a new universe with custom config
func NewUniverseWithConfig(cfg UniverseConfig) *Universe {
	return &Universe{
		activeList: NewActiveList(),
		worldSize:  cfg.WorldSize,
	}
}

// SetCell sets a cell at the given coordinates
func (u *Universe) SetCell(x, y int32, state CellState) {
	u.mu.Lock()
	defer u.mu.Unlock()

	coord := Coord{X: x, Y: y}
	oldCell := u.activeList.GetCell(coord)

	if state == Alive && oldCell.State == Dead {
		u.activeList.SetCell(coord, Cell{State: Alive, Age: 1})
		u.population.Add(1)
	} else if state == Dead && oldCell.State == Alive {
		u.activeList.SetCell(coord, Cell{State: Dead})
		u.population.Add(^uint32(0))
	}
}

// ToggleCell toggles a cell's state
func (u *Universe) ToggleCell(x, y int32) CellState {
	u.mu.Lock()
	defer u.mu.Unlock()

	coord := Coord{X: x, Y: y}
	cell := u.activeList.GetCell(coord)

	if cell.State == Alive {
		u.activeList.SetCell(coord, Cell{State: Dead})
		u.population.Add(^uint32(0))
		return Dead
	}

	u.activeList.SetCell(coord, Cell{State: Alive, Age: 1})
	u.population.Add(1)
	return Alive
}

// GetCell gets a cell at the given coordinates
func (u *Universe) GetCell(x, y int32) Cell {
	u.mu.RLock()
	defer u.mu.RUnlock()
	return u.activeList.GetCell(Coord{X: x, Y: y})
}

// NextGeneration advances the universe by one generation and returns diffs
func (u *Universe) NextGeneration() []CellDiff {
	u.mu.Lock()
	defer u.mu.Unlock()

	diffs := u.activeList.NextGeneration()

	// Update population count based on diffs
	for _, diff := range diffs {
		if diff.State == Alive {
			u.population.Add(1)
		} else {
			u.population.Add(^uint32(0))
		}
	}

	u.generation.Add(1)
	return diffs
}

// Generation returns the current generation
func (u *Universe) Generation() uint32 {
	return u.generation.Load()
}

// Population returns the current population
func (u *Universe) Population() uint32 {
	return u.population.Load()
}

// GetCells returns all alive cells
func (u *Universe) GetCells() []CellDiff {
	u.mu.RLock()
	defer u.mu.RUnlock()
	return u.activeList.GetAliveCells()
}

// GetCellsInViewport returns cells within a viewport
func (u *Universe) GetCellsInViewport(x1, y1, x2, y2 int32) []CellDiff {
	u.mu.RLock()
	defer u.mu.RUnlock()
	return u.activeList.GetCellsInViewport(x1, y1, x2, y2)
}

// Clear clears all cells
func (u *Universe) Clear() {
	u.mu.Lock()
	defer u.mu.Unlock()
	u.activeList = NewActiveList()
	u.population.Store(0)
}

// Randomize generates random cells
func (u *Universe) Randomize(density float64, centerX, centerY, radius int32) {
	u.mu.Lock()
	defer u.mu.Unlock()

	u.activeList = NewActiveList()
	u.population.Store(0)

	// Fast random generation using a simple PRNG
	seed := uint64(12345)
	for y := centerY - radius; y <= centerY+radius; y++ {
		for x := centerX - radius; x <= centerX+radius; x++ {
			// Simple xorshift PRNG
			seed ^= seed << 13
			seed ^= seed >> 17
			seed ^= seed << 5

			if float64(seed%1000)/1000 < density {
				coord := Coord{X: x, Y: y}
				u.activeList.SetCell(coord, Cell{State: Alive, Age: 1})
				u.population.Add(1)
			}
		}
	}
}

// InitializeWithPattern initializes with random cells
func (u *Universe) InitializeWithPattern() {
	// 在中心区域随机生成细胞 (1000x1000 世界，中心 500x500 区域)
	u.Randomize(0.15, 500, 500, 250)
}

// WorldSize returns the world size
func (u *Universe) WorldSize() int32 {
	return u.worldSize
}
