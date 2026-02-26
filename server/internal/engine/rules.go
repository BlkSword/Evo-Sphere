package engine

// ApplyRules applies Conway's Game of Life rules
// 1. Any live cell with 2 or 3 neighbors survives
// 2. Any dead cell with exactly 3 neighbors becomes alive
// 3. All other cells die or stay dead
func ApplyRules(currentState CellState, neighbors int8) CellState {
	if currentState == Alive {
		if neighbors == 2 || neighbors == 3 {
			return Alive
		}
		return Dead
	}

	// Dead cell
	if neighbors == 3 {
		return Alive
	}
	return Dead
}
