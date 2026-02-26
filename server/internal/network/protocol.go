package network

import (
	"encoding/binary"

	"github.com/evo-sphere/server/internal/engine"
)

// Message types (must match client)
const (
	MsgTypeHeartbeat    = 0x00
	MsgTypeCellUpdate   = 0x01
	MsgTypeViewportSub  = 0x02
	MsgTypeCellPlace    = 0x03
	MsgTypePlayerCursor = 0x04
	MsgTypeSnapshot     = 0x05
	MsgTypePlayerJoin   = 0x06
	MsgTypePlayerLeave  = 0x07
	MsgTypeWorldConfig  = 0x08
	MsgTypeClearWorld   = 0x09
	MsgTypeRandomize    = 0x0A
	MsgTypeSetSpeed     = 0x0B
)

// EncodeCellUpdate creates a CELL_UPDATE message
// Format: [type:1][count:2][cells...]
// Each cell: [x:4][y:4][state:1][age:1] = 10 bytes
func EncodeCellUpdate(diffs []engine.CellDiff) []byte {
	count := len(diffs)
	buf := make([]byte, 3+count*10)

	buf[0] = MsgTypeCellUpdate
	binary.LittleEndian.PutUint16(buf[1:3], uint16(count))

	for i, diff := range diffs {
		offset := 3 + i*10
		binary.LittleEndian.PutUint32(buf[offset:offset+4], uint32(diff.X))
		binary.LittleEndian.PutUint32(buf[offset+4:offset+8], uint32(diff.Y))
		buf[offset+8] = byte(diff.State)
		buf[offset+9] = diff.Age
	}

	return buf
}

// EncodeSnapshot creates a SNAPSHOT message
// Format: [type:1][generation:4][population:4][count:2][cells...]
// Each cell: [x:4][y:4][age:1] = 9 bytes
func EncodeSnapshot(cells []engine.CellDiff, generation, population uint32) []byte {
	count := len(cells)
	buf := make([]byte, 11+count*9)

	buf[0] = MsgTypeSnapshot
	binary.LittleEndian.PutUint32(buf[1:5], generation)
	binary.LittleEndian.PutUint32(buf[5:9], population)
	binary.LittleEndian.PutUint16(buf[9:11], uint16(count))

	for i, cell := range cells {
		offset := 11 + i*9
		binary.LittleEndian.PutUint32(buf[offset:offset+4], uint32(cell.X))
		binary.LittleEndian.PutUint32(buf[offset+4:offset+8], uint32(cell.Y))
		buf[offset+8] = cell.Age
	}

	return buf
}

// EncodePlayerJoin creates a PLAYER_JOIN message
// Format: [type:1][playerIdLen:1][playerId:N][nameLen:1][name:M][colorLen:1][color:K]
func EncodePlayerJoin(playerID, name, color string) []byte {
	playerIDBytes := []byte(playerID)
	nameBytes := []byte(name)
	colorBytes := []byte(color)

	totalLen := 2 + len(playerIDBytes) + 1 + len(nameBytes) + 1 + len(colorBytes)
	buf := make([]byte, totalLen)
	offset := 0

	buf[0] = MsgTypePlayerJoin
	buf[1] = byte(len(playerIDBytes))
	offset = 2
	copy(buf[offset:], playerIDBytes)
	offset += len(playerIDBytes)
	buf[offset] = byte(len(nameBytes))
	offset++
	copy(buf[offset:], nameBytes)
	offset += len(nameBytes)
	buf[offset] = byte(len(colorBytes))
	offset++
	copy(buf[offset:], colorBytes)

	return buf
}

// EncodePlayerLeave creates a PLAYER_LEAVE message
// Format: [type:1][playerIdLen:1][playerId:N]
func EncodePlayerLeave(playerID string) []byte {
	playerIDBytes := []byte(playerID)
	buf := make([]byte, 2+len(playerIDBytes))

	buf[0] = MsgTypePlayerLeave
	buf[1] = byte(len(playerIDBytes))
	copy(buf[2:], playerIDBytes)

	return buf
}

// EncodePlayerCursor creates a PLAYER_CURSOR message
// Format: [type:1][playerIdLen:1][playerId:N][x:4][y:4]
func EncodePlayerCursor(playerID string, x, y int32) []byte {
	playerIDBytes := []byte(playerID)
	buf := make([]byte, 2+len(playerIDBytes)+8)

	buf[0] = MsgTypePlayerCursor
	buf[1] = byte(len(playerIDBytes))
	copy(buf[2:], playerIDBytes)

	offset := 2 + len(playerIDBytes)
	binary.LittleEndian.PutUint32(buf[offset:offset+4], uint32(x))
	binary.LittleEndian.PutUint32(buf[offset+4:offset+8], uint32(y))

	return buf
}

// EncodeWorldConfig creates a WORLD_CONFIG message
// Format: [type:1][worldSize:4][cellSize:4][maxPopulation:4]
func EncodeWorldConfig(worldSize, cellSize, maxPopulation int32) []byte {
	buf := make([]byte, 13)

	buf[0] = MsgTypeWorldConfig
	binary.LittleEndian.PutUint32(buf[1:5], uint32(worldSize))
	binary.LittleEndian.PutUint32(buf[5:9], uint32(cellSize))
	binary.LittleEndian.PutUint32(buf[9:13], uint32(maxPopulation))

	return buf
}

// DecodeViewport parses viewport data
// Format: [x1:4][y1:4][x2:4][y2:4]
func DecodeViewport(data []byte) Viewport {
	return Viewport{
		X1: int32(binary.LittleEndian.Uint32(data[0:4])),
		Y1: int32(binary.LittleEndian.Uint32(data[4:8])),
		X2: int32(binary.LittleEndian.Uint32(data[8:12])),
		Y2: int32(binary.LittleEndian.Uint32(data[12:16])),
	}
}

// DecodeCellPlace parses cell place data
// Format: [x:4][y:4]
func DecodeCellPlace(data []byte) (x, y int32) {
	x = int32(binary.LittleEndian.Uint32(data[0:4]))
	y = int32(binary.LittleEndian.Uint32(data[4:8]))
	return
}

// DecodePlayerCursor parses player cursor data
// Format: [playerIdLen:1][playerId:N][x:4][y:4]
func DecodePlayerCursor(data []byte) (playerID string, x, y int32) {
	playerIDLen := int(data[0])
	playerID = string(data[1 : 1+playerIDLen])
	x = int32(binary.LittleEndian.Uint32(data[1+playerIDLen : 5+playerIDLen]))
	y = int32(binary.LittleEndian.Uint32(data[5+playerIDLen : 9+playerIDLen]))
	return
}

// DecodeSetSpeed parses speed setting
// Format: [speed:4]
func DecodeSetSpeed(data []byte) uint32 {
	return binary.LittleEndian.Uint32(data[0:4])
}
