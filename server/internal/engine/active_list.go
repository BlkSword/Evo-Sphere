package engine

// ActiveList tracks active cells using sparse storage
type ActiveList struct {
	cells      map[Coord]Cell
	candidates map[Coord]int8
}

// NewActiveList creates a new active list
func NewActiveList() *ActiveList {
	return &ActiveList{
		cells:      make(map[Coord]Cell),
		candidates: make(map[Coord]int8),
	}
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
	oldCell := al.GetCell(coord)
	if cell.State == oldCell.State {
		return
	}

	if cell.State == Alive {
		al.cells[coord] = cell
		al.addToCandidates(coord)
	} else {
		delete(al.cells, coord)
		al.removeFromCandidates(coord)
	}
}

func (al *ActiveList) addToCandidates(coord Coord) {
	for dx := int32(-1); dx <= 1; dx++ {
		for dy := int32(-1); dy <= 1; dy++ {
			neighborCoord := Coord{X: coord.X + dx, Y: coord.Y + dy}
			al.candidates[neighborCoord]++
		}
	}
}

func (al *ActiveList) removeFromCandidates(coord Coord) {
	for dx := int32(-1); dx <= 1; dx++ {
		for dy := int32(-1); dy <= 1; dy++ {
			neighborCoord := Coord{X: coord.X + dx, Y: coord.Y + dy}
			al.candidates[neighborCoord]--
			if al.candidates[neighborCoord] <= 0 {
				delete(al.candidates, neighborCoord)
			}
		}
	}
}

func (al *ActiveList) countNeighbors(coord Coord) int8 {
	var count int8
	for dx := int32(-1); dx <= 1; dx++ {
		for dy := int32(-1); dy <= 1; dy++ {
			if dx == 0 && dy == 0 {
				continue
			}
			neighborCoord := Coord{X: coord.X + dx, Y: coord.Y + dy}
			if al.GetCell(neighborCoord).State == Alive {
				count++
			}
		}
	}
	return count
}

// NextGeneration computes the next generation and returns diffs
func (al *ActiveList) NextGeneration() []CellDiff {
	diffs := make([]CellDiff, 0)
	changes := make([]struct {
		coord Coord
		cell  Cell
	}, 0)

	// Snapshot candidates
	candidatesCopy := make(map[Coord]int8, len(al.candidates))
	for k, v := range al.candidates {
		candidatesCopy[k] = v
	}

	for coord := range candidatesCopy {
		neighbors := al.countNeighbors(coord)
		currentCell := al.GetCell(coord)
		newState := ApplyRules(currentCell.State, neighbors)

		if newState != currentCell.State {
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
		} else if currentCell.State == Alive {
			newAge := currentCell.Age + 1
			if newAge > 255 {
				newAge = 255
			}
			al.cells[coord] = Cell{State: Alive, Age: newAge}
		}
	}

	// Apply changes
	for _, change := range changes {
		al.SetCell(change.coord, change.cell)
	}

	return diffs
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
