package engine

// ActiveList tracks active cells using sparse storage with optimized neighbor counting
type ActiveList struct {
	cells      map[Coord]Cell   // 活细胞
	neighbors  map[Coord]int8   // 每个坐标的邻居计数 (优化：直接维护)
}

// NewActiveList creates a new active list
func NewActiveList() *ActiveList {
	return &ActiveList{
		cells:     make(map[Coord]Cell),
		neighbors: make(map[Coord]int8),
	}
}

// neighborOffsets 预计算的邻居偏移量
var neighborOffsets = [8]Coord{
	{-1, -1}, {0, -1}, {1, -1},
	{-1, 0},           {1, 0},
	{-1, 1},  {0, 1},  {1, 1},
}

// GetCell returns the cell at a coordinate
func (al *ActiveList) GetCell(coord Coord) Cell {
	if cell, ok := al.cells[coord]; ok {
		return cell
	}
	return Cell{State: Dead, Age: 0}
}

// SetCell sets a cell at a coordinate
func (al *ActiveList) SetCell(coord Coord, cell Cell) {
	oldCell, exists := al.cells[coord]
	oldState := Dead
	if exists {
		oldState = oldCell.State
	}

	if cell.State == oldState {
		return
	}

	if cell.State == Alive {
		// 添加活细胞
		al.cells[coord] = cell
		// 增加邻居计数
		for _, offset := range neighborOffsets {
			al.neighbors[Coord{X: coord.X + offset.X, Y: coord.Y + offset.Y}]++
		}
	} else {
		// 移除活细胞
		delete(al.cells, coord)
		// 减少邻居计数
		for _, offset := range neighborOffsets {
			nc := Coord{X: coord.X + offset.X, Y: coord.Y + offset.Y}
			al.neighbors[nc]--
			if al.neighbors[nc] <= 0 {
				delete(al.neighbors, nc)
			}
		}
	}
}

// NextGeneration computes the next generation using optimized neighbor lookup
func (al *ActiveList) NextGeneration() []CellDiff {
	diffs := make([]CellDiff, 0, len(al.neighbors))
	changes := make([]struct {
		coord Coord
		cell  Cell
	}, 0, len(al.neighbors)/4)

	// 直接使用 neighbors map，无需复制
	// 遍历所有有邻居计数的坐标
	for coord, neighborCount := range al.neighbors {
		currentCell, isAlive := al.cells[coord]
		currentState := Dead
		if isAlive {
			currentState = currentCell.State
		}

		// 优化：使用查找表代替条件判断
		newState := applyRulesOptimized(currentState, neighborCount)

		if newState != currentState {
			var newCell Cell
			if newState == Alive {
				newCell = Cell{State: Alive, Age: 1}
			} else {
				newCell = Cell{State: Dead, Age: 0}
			}
			changes = append(changes, struct {
				coord Coord
				cell  Cell
			}{coord: coord, cell: newCell})

			diffs = append(diffs, CellDiff{
				X:     coord.X,
				Y:     coord.Y,
				State: newState,
				Age:   newCell.Age,
			})
		} else if isAlive {
			// 存活细胞增加年龄
			newAge := currentCell.Age + 1
			if newAge > 255 {
				newAge = 255
			}
			al.cells[coord] = Cell{State: Alive, Age: newAge}
		}
	}

	// 批量应用变化
	for _, change := range changes {
		al.SetCell(change.coord, change.cell)
	}

	return diffs
}

// applyRulesOptimized 使用查找表优化的规则应用
// 预计算：state << 4 | neighbors 作为索引
var ruleTable = [32]CellState{
	// Dead cells (state=0)
	0: Dead, 1: Dead, 2: Dead, 3: Alive, 4: Dead, 5: Dead, 6: Dead, 7: Dead, 8: Dead,
	// Alive cells (state=1) - 偏移16
	16: Dead, 17: Dead, 18: Alive, 19: Alive, 20: Dead, 21: Dead, 22: Dead, 23: Dead, 24: Dead,
}

func applyRulesOptimized(state CellState, neighbors int8) CellState {
	if neighbors < 0 || neighbors > 8 {
		return Dead
	}
	idx := int(state<<4) | int(neighbors)
	if idx >= 32 {
		return Dead
	}
	return ruleTable[idx]
}

// GetAliveCells returns all alive cells
func (al *ActiveList) GetAliveCells() []CellDiff {
	cells := make([]CellDiff, 0, len(al.cells))
	for coord, cell := range al.cells {
		if cell.State == Alive {
			cells = append(cells, CellDiff{
				X:     coord.X,
				Y:     coord.Y,
				State: Alive,
				Age:   cell.Age,
			})
		}
	}
	return cells
}

// GetCellsInViewport returns cells within a viewport
func (al *ActiveList) GetCellsInViewport(x1, y1, x2, y2 int32) []CellDiff {
	cells := make([]CellDiff, 0)
	for coord, cell := range al.cells {
		if cell.State == Alive &&
			coord.X >= x1 && coord.X <= x2 &&
			coord.Y >= y1 && coord.Y <= y2 {
			cells = append(cells, CellDiff{
				X:     coord.X,
				Y:     coord.Y,
				State: Alive,
				Age:   cell.Age,
			})
		}
	}
	return cells
}

// Count returns the number of alive cells
func (al *ActiveList) Count() int {
	return len(al.cells)
}
