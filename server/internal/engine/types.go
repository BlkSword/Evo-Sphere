package engine

// Cell states
const (
	Dead CellState = iota
	Alive
)

// Coord represents a cell coordinate
type Coord struct {
	X int32
	Y int32
}

// CellState represents the state of a cell
type CellState uint8

// Cell represents a cell with state and age
type Cell struct {
	State CellState
	Age   uint8
}

// CellDiff represents a cell change for network transmission
type CellDiff struct {
	X     int32
	Y     int32
	State CellState
	Age   uint8
}
