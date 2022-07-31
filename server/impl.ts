import { Methods, Context } from "./.hathora/methods";
import { Response } from "../api/base";
import {
  Direction,
  Location,
  Player,
  GameState,
  UserId,
  IInitializeRequest,
  IJoinGameRequest,
  IMoveToRequest,
  IChangeDirRequest, 
  IShootRequest,
  Bullet,
} from "../api/types";

type InternalPlayer = {
  id: UserId,
  location: Location,
  lookingDirection: Direction,
  hp: number,
  ammo: number,
  targetLoc?: Location,
  targetDir?: Direction,
};

type InternalBullet = {
  id: number,
  location: Location,
  direction: Direction,
};

type InternalState = {
  players: InternalPlayer[],
  bullets: InternalBullet[],
  bulletsCount: number,
};

export class Impl implements Methods<InternalState> {
  initialize(ctx: Context, request: IInitializeRequest): InternalState {
    return {
      players: [],
      bullets: [],
      bulletsCount: 0,
    };
  }
  joinGame(state: InternalState, userId: UserId, ctx: Context, request: IJoinGameRequest): Response {
    state.players.push({
	id: userId,
	location: {
	  x: Math.floor(Math.random() * 1024),
	  y: Math.floor(Math.random() * 1024)
	},
	lookingDirection: Direction.UP,
	hp: 10,
	ammo: 48
    });
    return Response.ok();
  }
  moveTo(state: InternalState, userId: UserId, ctx: Context, request: IMoveToRequest): Response {
    let player = state.players.find((p) => p.id === userId);
    if (player === undefined) { return Response.error("Not joined"); }
    if (player.hp > 0)
      player.targetLoc = request.location;
    return Response.ok();
  }
  changeDir(state: InternalState, userId: UserId, ctx: Context, request: IChangeDirRequest): Response {
    let player = state.players.find((p) => p.id === userId);
    if (player === undefined) { return Response.error("Not joined"); }
    player.targetDir = request.dir;
    return Response.ok();
  }
  shoot(state: InternalState, userId: UserId, ctx: Context, request: IShootRequest): Response {
    let bulletId = state.bulletsCount + 1;
    let player = state.players.find((p) => p.id === userId);
    if (player === undefined) {
       return Response.error("Not joined");
    }
    if (player.ammo > 0 && player.hp > 0)
      player.ammo -= 1;
    else
      return Response.ok();

    let x = player.location.x;
    let y = player.location.y;
    switch (player.lookingDirection) {
      case Direction.UP:
        y -= 33;
        break;
      case Direction.DOWN:
        y += 33;
        break;
      case Direction.LEFT:
        x -= 33;
        break;
      case Direction.RIGHT:
        x += 33;
        break;
    }
    state.bullets.push({
	location: { x: x, y: y },
	direction: player.lookingDirection,
	id: bulletId
    });
    return Response.ok();
  }
  getUserState(state: InternalState, userId: UserId): GameState {
    return state;
  }
  onTick(state: InternalState, ctx: Context, timeDelta: number): void {
    const PLAYER_SPEED = 90;
    const BULLET_SPEED = 300;
    for (const player of state.players) {
      if (player.targetLoc !== undefined) {
        var dx = Math.abs(player.targetLoc.x - player.location.x);
        var dy = Math.abs(player.targetLoc.y - player.location.y);
        var toMove = PLAYER_SPEED * timeDelta;
        if (dx > 0 && dx <= toMove) {
          player.location.x = player.targetLoc.x;
          player.location.x = Math.max(player.location.x, 0);
          player.location.x = Math.min(player.location.x, 1024);
          continue;
        }
        if (dy > 0 && dy <= toMove) {
          player.location.y = player.targetLoc.y;
          player.location.y = Math.max(player.location.y, 0);
          player.location.y = Math.min(player.location.y, 1024);
        }
      }
      if (player.targetDir !== undefined) {
        player.lookingDirection = player.targetDir;
      }
    }
    for (const bullet of state.bullets) {
      if (bullet.direction === Direction.UP) {
        bullet.location.y -= BULLET_SPEED * timeDelta;
      }
      if (bullet.direction === Direction.DOWN) {
        bullet.location.y += BULLET_SPEED * timeDelta;
      }
      if (bullet.direction === Direction.LEFT) {
        bullet.location.x += BULLET_SPEED * timeDelta;
      }
      if (bullet.direction === Direction.RIGHT) {
        bullet.location.x -= BULLET_SPEED * timeDelta;
      }
      if (state.players.filter((p) => {
        let dx = p.location.x - bullet.location.x;
        let dy = p.location.y - bullet.location.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        return distance <= 32;
      }).map((p) => {
        if (p.hp > 0) p.hp -= 1;
        if (p.hp <= 0) p.ammo = 0;
      }).length > 0)
        bullet.id = -1;
    }
    state.bullets = state.bullets.filter((b) => {
      if (b.id === -1) return false;
      if (b.location.x >= 1024) return false;
      if (b.location.x <= 0) return false;
      if (b.location.y >= 1024) return false;
      if (b.location.y <= 0) return false;
      return true;
    });
  }
}
