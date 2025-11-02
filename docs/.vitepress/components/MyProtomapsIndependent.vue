<template>
  <div class="contenedor">
    <div class="cubo cubo-1"><img src="/cubo1.svg" alt="Cubo" /></div>
    <div class="cubo cubo-2"><img src="/cubo2.svg" alt="Cubo" /></div>
    <div class="cubo cubo-3"><img src="/cubo3.svg" alt="Cubo" /></div>
    <div class="cubo cubo-4"><img src="/cubo4.svg" alt="Cubo" /></div>
    <div class="cubo cubo-5"><img src="/cubo5.svg" alt="Cubo" /></div>
    <div class="cubo cubo-6"><img src="/cubo6.svg" alt="Cubo" /></div>
    <div class="cubo cubo-7"><img src="/cubo7.svg" alt="Cubo" /></div>
    <div class="cubo cubo-8"><img src="/cubo8.svg" alt="Cubo" /></div>
    <div class="cubo cubo-9"><img src="/cubo9.svg" alt="Cubo" /></div>
    <div class="cubo cubo-10"><img src="/cubo2.svg" alt="Cubo" /></div>
    <div class="cubo cubo-11"><img src="/cubo4.svg" alt="Cubo" /></div>
    <div class="cubo cubo-12"><img src="/cubo6.svg" alt="Cubo" /></div>
    <div class="cubo cubo-13"><img src="/cubo8.svg" alt="Cubo" /></div>
    <div class="cubo cubo-14"><img src="/cubo1.svg" alt="Cubo" /></div>
    <div class="cubo cubo-15"><img src="/cubo3.svg" alt="Cubo" /></div>
    <div class="cubo cubo-16"><img src="/cubo5.svg" alt="Cubo" /></div>
    <div class="cubo cubo-17"><img src="/cubo7.svg" alt="Cubo" /></div>
    <div class="cubo cubo-18"><img src="/cubo9.svg" alt="Cubo" /></div>
    <div class="cubo cubo-19"><img src="/cubo9.svg" alt="Cubo" /></div>
    <div class="cubo cubo-20"><img src="/cubo7.svg" alt="Cubo" /></div>
    <div class="cubo cubo-21"><img src="/cubo5.svg" alt="Cubo" /></div>
    <div class="cubo cubo-22"><img src="/cubo3.svg" alt="Cubo" /></div>
    <div class="cubo cubo-23"><img src="/cubo1.svg" alt="Cubo" /></div>
    <div class="cubo cubo-24"><img src="/cubo8.svg" alt="Cubo" /></div>
    <div class="cubo cubo-25"><img src="/cubo6.svg" alt="Cubo" /></div>
    <div class="cubo cubo-26"><img src="/cubo4.svg" alt="Cubo" /></div>
    <div class="cubo cubo-27"><img src="/cubo2.svg" alt="Cubo" /></div>
</div>
</template>

<style>
:root {
  --content-len: 20vw;
  --cube-size: calc(var(--content-len) / 4);
  --intro: calc(var(--cube-size));
  ---a: calc(-1 * var(--cube-size) * 33/110);
  ---aa: calc(var(---a) * 2);
  --dist-cubes-np: calc((var(--cube-size) / 2) + (var(--cube-size) * 1/5)); /*7/58*/
  --dist-cubes-nn: calc(-1 * var(--dist-cubes-np));
  --dist-cubes-np-a: calc(var(--dist-cubes-np) + var(---a));
  --dist-cubes-np-aa: calc(var(--dist-cubes-np) + var(---aa));
  --dist-cubes-nn-a: calc(var(--dist-cubes-nn) + var(---a));
  --dist-cubes-nn-aa: calc(var(--dist-cubes-nn) + var(---aa));
  --dist-content-np: calc(var(--content-len) / 2);
  --dist-content-nn: calc(-1 * var(--dist-content-np));
  --time: 7s;
}

.contenedor {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  position: absolute; /**/
  top: -500px; /**/
  left: 30%;
  transform: translateX(-4%);
  z-index: 1;
}


.cubo {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-origin: center;
  width: var(--cube-size);
  height: var(--cube-size);
}

.cubo img {
  width: 100%;
  height: 100%;
}

.cubo-1 {
  z-index: 27;
  animation: 
    moverCuboSuperior1 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboSuperior1 {
  0% {
    transform: translate(var(--dist-content-nn), calc(-1 * var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-nn) - var(--intro)), calc(var(--dist-cubes-nn) - var(--intro)));
    opacity: 1;
  }

  10% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-nn));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-nn));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-nn));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-nn));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-nn));
    opacity: 0;
  }
}

.cubo-2 {
  z-index: 26;
  animation: moverCuboRelativo2 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo2 {
  0% {
    transform: translate(0, calc(-1 * var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(0, calc(var(--dist-cubes-nn) - var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(0, calc(var(--dist-cubes-nn)));
    margin: 1rem;
    opacity: 1;
  }
  50% {
    transform: translate(0, calc(var(--dist-cubes-nn)));
    opacity: 1;
  }
  65% {
    transform: translate(0, calc(var(--dist-cubes-nn)));
    opacity: 1;
  }
  80% {
    transform: translate(0, calc(var(--dist-cubes-nn)));
    opacity: 1;
  }
  100% {
    transform: translate(0, calc(var(--dist-cubes-nn)));
    opacity: 0;
  }
}

.cubo-3 {
  z-index: 25;
  animation: moverCuboRelativo3 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo3 {
  0% {
    transform: translate(var(--dist-content-np), calc(-1 * var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-np) + var(--intro)), calc(var(--dist-cubes-nn) - var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-nn));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-nn));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-nn));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-nn));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-nn));
    opacity: 0;
  }
}

.cubo-4 {
  z-index: 24;
  animation: moverCuboRelativo4 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo4 {
  0% {
    transform: translate(var(--dist-content-nn), 0);
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-nn) - var(--intro)), 0);
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-nn), 0);
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-nn), 0);
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-nn), 0);
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-nn), 0);
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-nn), 0);
    opacity: 0;
  }
}

.cubo-5 {
  z-index: 23;
  animation: moverCuboRelativo5 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo5 {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  5% {
    transform: translate(0, 0);
    opacity: 1;
  }
  10% {
    transform: translate(0, 0);
    opacity: 1;
  }
  50% {
    transform: translate(0, 0);
    opacity: 1;
  }
  65% {
    transform: translate(0, 0);
    opacity: 1;
  }
  80% {
    transform: translate(0, 0);
    opacity: 1;
  }
  100% {
    transform: translate(0, 0);
    opacity: 0;
  }
}

.cubo-6 {
  z-index: 22;
  animation: moverCuboRelativo6 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo6 {
  0% {
    transform: translate(var(--dist-content-np), 0);
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-np) + var(--intro)), 0);
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-np), 0);
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-np), 0);
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-np), 0);
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-np), 0);
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-np), 0);
    opacity: 0;
  }
}

.cubo-7 {
  z-index: 21;
  animation: moverCuboRelativo7 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo7 {
  0% {
    transform: translate(var(--dist-content-nn), calc(var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-nn) - var(--intro)), calc(var(--dist-cubes-np) + var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-np));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-np));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-np));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-np));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-nn), var(--dist-cubes-np));
    opacity: 0;
  }
}

.cubo-8 {
  z-index: 20;
  animation: moverCuboRelativo8 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo8 {
  0% {
    transform: translate(0, calc(var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(0, calc(var(--dist-cubes-np) + var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(0, var(--dist-cubes-np));
    opacity: 1;
  }
  50% {
    transform: translate(0, var(--dist-cubes-np));
    opacity: 1;
  }
  65% {
    transform: translate(0, var(--dist-cubes-np));
    opacity: 1;
  }
  80% {
    transform: translate(0, var(--dist-cubes-np));
    opacity: 1;
  }
  100% {
    transform: translate(0, var(--dist-cubes-np));
    opacity: 0;
  }
}

.cubo-9 {
  z-index: 19;
  animation: moverCuboRelativo9 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo9 {
  0% {
    transform: translate(var(--dist-content-np), calc(var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-np) + var(--intro)), calc(var(--dist-cubes-np) + var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-np));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-np));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-np));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-np));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-np), var(--dist-cubes-np));
    opacity: 0;
  }
}

.cubo-10 {
  z-index: 18;
  animation: moverCuboSuperior10 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboSuperior10 {
  0% {
    transform: translate(var(--dist-content-nn), calc(-1 * var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-nn-a) - var(--intro)), calc(var(--dist-cubes-nn-a) - var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-nn-a));
    opacity: 0;
  }
}

.cubo-11 {
  z-index: 17;
  animation: moverCuboRelativo11 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo11 {
  0% {
    transform: translate(0, calc(-1 * var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(var(---a), calc(var(--dist-cubes-nn-a) - var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(---a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  50% {
    transform: translate(var(---a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  65% {
    transform: translate(var(---a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  80% {
    transform: translate(var(---a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  100% {
    transform: translate(var(---a), var(--dist-cubes-nn-a));
    opacity: 0;
  }
}

.cubo-12 {
  z-index: 16;
  animation: moverCuboRelativo12 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo12 {
  0% {
    transform: translate(var(--dist-content-np), calc(-1 * var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-np-a) + var(--intro)), calc(var(--dist-cubes-nn-a) - var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-nn-a));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-nn-a));
    opacity: 0;
  }
}

.cubo-13 {
  z-index: 15;
  animation: moverCuboRelativo13 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo13 {
  0% {
    transform: translate(var(--dist-content-nn), 0);
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-nn-a) - var(--intro)), var(---a));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-nn-a), var(---a));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-nn-a), var(---a));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-nn-a), var(---a));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-nn-a), var(---a));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-nn-a), var(---a));
    opacity: 0;
  }
}

.cubo-14 {
  z-index: 14;
  animation: moverCuboRelativo14 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo14 {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  5% {
    transform: translate(var(---a), var(---a));
    opacity: 1;
  }
  10% {
    transform: translate(var(---a), var(---a));
    opacity: 1;
  }
  50% {
    transform: translate(var(---a), var(---a));
    opacity: 1;
  }
  65% {
    transform: translate(var(---a), var(---a));
    opacity: 1;
  }
  80% {
    transform: translate(var(---a), var(---a));
    opacity: 1;
  }
  100% {
    transform: translate(var(---a), var(---a));
    opacity: 0;
  }
}

.cubo-15 {
  z-index: 13;
  animation: moverCuboRelativo15 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo15 {
  0% {
    transform: translate(var(--dist-content-np), 0);
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-np-a) + var(--intro)), var(---a));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-np-a), var(---a));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-np-a), var(---a));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-np-a), var(---a));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-np-a), var(---a));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-np-a), var(---a));
    opacity: 0;
  }
}

.cubo-16 {
  z-index: 12;
  animation: moverCuboRelativo16 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo16 {
  0% {
    transform: translate(var(--dist-content-nn), calc(var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-nn-a) - var(--intro)), calc(var(--dist-cubes-np-a) + var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-nn-a), var(--dist-cubes-np-a));
    opacity: 0;
  }
}

.cubo-17 {
  z-index: 11;
  animation: moverCuboRelativo17 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo17 {
  0% {
    transform: translate(0, calc(var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(var(---a), calc(var(--dist-cubes-np-a) + var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(---a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  50% {
    transform: translate(var(---a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  65% {
    transform: translate(var(---a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  80% {
    transform: translate(var(---a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  100% {
    transform: translate(var(---a), var(--dist-cubes-np-a));
    opacity: 0;
  }
}

.cubo-18 {
  z-index: 10;
  animation: moverCuboRelativo18 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo18 {
  0% {
    transform: translate(var(--dist-content-np), calc(var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-np-a) + var(--intro)), calc(var(--dist-cubes-np-a) + var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-np-a));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-np-a), var(--dist-cubes-np-a));
    opacity: 0;
  }
}

.cubo-19 {
  z-index: 9;
  animation: moverCuboRelativo19 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo19 {
  0% {
    transform: translate(var(--dist-content-nn), calc(-1 * var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-nn-aa) - var(--intro)), calc(var(--dist-cubes-nn-aa) - var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-nn-aa));
    opacity: 0;
  }
}

.cubo-20 {
  z-index: 8;
  animation: moverCuboRelativo20 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo20 {
  0% {
    transform: translate(0, calc(-1 * var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(var(---aa), calc(var(--dist-cubes-nn-aa) - var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(---aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  50% {
    transform: translate(var(---aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  65% {
    transform: translate(var(---aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  80% {
    transform: translate(var(---aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  100% {
    transform: translate(var(---aa), var(--dist-cubes-nn-aa));
    opacity: 0;
  }
}

.cubo-21 {
  z-index: 7;
  animation: moverCuboRelativo21 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo21 {
  0% {
    transform: translate(var(--dist-content-np), calc(-1 * var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-np-aa) + var(--intro)), calc(var(--dist-cubes-nn-aa) - var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-nn-aa));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-nn-aa));
    opacity: 0;
  }
}

.cubo-22 {
  z-index: 6;
  animation: moverCuboRelativo22 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo22 {
  0% {
    transform: translate(var(--dist-content-nn), 0);
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-nn-aa) - var(--intro)), var(---aa));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-nn-aa), var(---aa));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-nn-aa), var(---aa));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-nn-aa), var(---aa));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-nn-aa), var(---aa));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-nn-aa), var(---aa));
    opacity: 0;
  }
}

.cubo-23 {
  z-index: 5;
  animation: moverCuboRelativo23 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo23 {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  5% {
    transform: translate(var(---aa), var(---aa));
    opacity: 1;
  }
  10% {
    transform: translate(var(---aa), var(---aa));
    opacity: 1;
  }
  50% {
    transform: translate(var(---aa), var(---aa));
    opacity: 1;
  }
  65% {
    transform: translate(var(---aa), var(---aa));
    opacity: 1;
  }
  80% {
    transform: translate(var(---aa), var(---aa));
    opacity: 1;
  }
  100% {
    transform: translate(var(---aa), var(---aa));
    opacity: 0;
  }
}

.cubo-24 {
  z-index: 4;
  animation: moverCuboRelativo24 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo24 {
  0% {
    transform: translate(var(--dist-content-np), 0);
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-np-aa) + var(--intro)), var(---aa));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-np-aa), var(---aa));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-np-aa), var(---aa));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-np-aa), var(---aa));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-np-aa), var(---aa));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-np-aa), var(---aa));
    opacity: 0;
  }
}

.cubo-25 {
  z-index: 3;
  animation: moverCuboRelativo25 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo25 {
  0% {
    transform: translate(var(--dist-content-nn), calc(var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-nn-aa) - var(--intro)), calc(var(--dist-cubes-np-aa) + var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-nn-aa), var(--dist-cubes-np-aa));
    opacity: 0;
  }
}

.cubo-26 {
  z-index: 2;
  animation: moverCuboRelativo26 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo26 {
  0% {
    transform: translate(0, calc(var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(var(---aa), calc(var(--dist-cubes-np-aa) + var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(---aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  50% {
    transform: translate(var(---aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  65% {
    transform: translate(var(---aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  80% {
    transform: translate(var(---aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  100% {
    transform: translate(var(---aa), var(--dist-cubes-np-aa));
    opacity: 0;
  }
}

.cubo-27 {
  z-index: 1;
  animation: moverCuboRelativo27 var(--time) ease-in-out infinite alternate;
}

@keyframes moverCuboRelativo27 {
  0% {
    transform: translate(var(--dist-content-np), calc(var(--content-len) / 2));
    opacity: 0;
  }
  5% {
    transform: translate(calc(var(--dist-cubes-np-aa) + var(--intro)), calc(var(--dist-cubes-np-aa) + var(--intro)));
    opacity: 1;
  }
  10% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  50% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  65% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  80% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-np-aa));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dist-cubes-np-aa), var(--dist-cubes-np-aa));
    opacity: 0;
  }
}



@media (max-width: 1073px) {
  .contenedor {
    position: absolute; /**/
    top: -540px; /**/
    left: 30%;
    transform: translateX(-1%);
    z-index: 1;
  }
}
@media (max-width: 959px) {
  .contenedor {
    position: absolute; /**/
    top: -800px; /**/
    left: 30%;
    transform: translateX(-28%);
    z-index: 1;
    display: flex;
  }
}
@media (max-width: 767px) {
  .contenedor {
    position: absolute; /**/
    top: -1130px; /**/
    left: 30%;
    transform: translateX(-28%);
    z-index: 1;
    display: flex;
  }
}
@media (max-width: 651px) {
  .contenedor {
    position: absolute; /**/
    top: -1200px; /**/
    left: 30%;
    transform: translateX(-28%);
    z-index: 1;
    display: flex;
  }
}
@media (max-width: 651px) {
  .contenedor {
    position: absolute; /**/
    top: -1050px; /**/
    left: 30%;
    transform: translateX(-28%);
    z-index: 1;
    display: flex;
  }
}
@media (max-width: 495px) {
  .contenedor {
    position: absolute; /**/
    top: -1100px; /**/
    left: 30%;
    transform: translateX(-28%);
    z-index: 1;
    display: flex;
  }
}
@media (max-width: 426px) {
  .contenedor {
    position: absolute; /**/
    top: -1200px; /**/
    left: 30%;
    transform: translateX(-28%);
    z-index: 1;
    display: flex;
  }
}
@media (max-width: 363px) {
  .contenedor {
    position: absolute; /**/
    top: -1280px; /**/
    left: 30%;
    transform: translateX(-28%);
    z-index: 1;
    display: flex;
  }
}
@media (max-width: 363px) {
  .contenedor {
    position: absolute; /**/
    top: -1300px; /**/
    left: 30%;
    transform: translateX(-28%);
    z-index: 1;
    display: flex;
  }
}
</style>
