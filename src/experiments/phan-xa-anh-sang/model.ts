export interface PhanXaParams {
  i: number;           // Góc tới i (độ, so với pháp tuyến)
  mirrorAngle: number; // Góc nghiêng của gương phẳng so với phương ngang (độ)
}

export interface PhanXaOutputs {
  i_prime: number;          // Góc phản xạ i' (độ)
  angleBetweenRays: number; // Góc hợp bởi tia tới và tia phản xạ (2i)
  angleWithMirror: number;  // Góc hợp bởi tia tới và mặt gương (90 - i)
}

export function computePhanXa(params: PhanXaParams): PhanXaOutputs {
  const i = Math.max(0, Math.min(89.5, params.i));
  const i_prime = i; // Định luật phản xạ ánh sáng: i' = i
  const angleBetweenRays = 2 * i;
  const angleWithMirror = 90 - i;

  return {
    i_prime,
    angleBetweenRays,
    angleWithMirror
  };
}
