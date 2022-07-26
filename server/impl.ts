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
} from "../api/types";

type InternalState = GameState;

export class Impl implements Methods<InternalState> {
  initialize(ctx: Context, request: IInitializeRequest): InternalState {
    return {
      players: [],
    };
  }
  joinGame(state: InternalState, userId: UserId, ctx: Context, request: IJoinGameRequest): Response {
    return Response.error("Not implemented");
  }
  moveTo(state: InternalState, userId: UserId, ctx: Context, request: IMoveToRequest): Response {
    return Response.error("Not implemented");
  }
  getUserState(state: InternalState, userId: UserId): GameState {
    return state;
  }
  onTick(state: InternalState, ctx: Context, timeDelta: number): void {}
}
