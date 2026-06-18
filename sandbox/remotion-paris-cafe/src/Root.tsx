import { Composition } from "remotion";
import {
  ParisAutumnCafe,
  PARIS_CAFE_DEFAULT_PROPS,
  PARIS_CAFE_HEIGHT,
  PARIS_CAFE_WIDTH,
} from "./ParisAutumnCafe";
import {
  CoffeeTalkGif,
  COFFEE_GIF_HEIGHT,
  COFFEE_GIF_WIDTH,
} from "./CoffeeTalkGif";

export const RemotionRoot = () => (
  <>
    <Composition
      id="ParisAutumnCafe"
      component={ParisAutumnCafe}
      durationInFrames={150}
      fps={30}
      width={PARIS_CAFE_WIDTH}
      height={PARIS_CAFE_HEIGHT}
      defaultProps={PARIS_CAFE_DEFAULT_PROPS}
    />
    <Composition
      id="CoffeeTalkGif"
      component={CoffeeTalkGif}
      durationInFrames={60}
      fps={15}
      width={COFFEE_GIF_WIDTH}
      height={COFFEE_GIF_HEIGHT}
    />
  </>
);
