export function resize(file, max = 640) {
  return new Promise((res, rej) => {
    const rd = new FileReader();
    rd.onload = () => {
      const i = new Image();
      i.onload = () => {
        const k = Math.min(1, max / i.width), c = document.createElement('canvas');
        c.width = i.width * k; c.height = i.height * k;
        c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.8));
      };
      i.onerror = rej; i.src = rd.result;
    };
    rd.onerror = rej; rd.readAsDataURL(file);
  });
}
