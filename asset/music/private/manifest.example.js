// Copy this file to manifest.js (same folder) and edit it. manifest.js and the audio files are git-ignored.
// One entry per song; the same decade repeated makes that decade's list, played in that order. The file
// name is exactly as it sits in this folder (.m4a from the iTunes Store, or .mp3). start and end are seconds
// and optional: the track begins at start (the chorus, CJ 2026-09-23 「use chorus」) and at end goes back to
// start instead of playing on. Leave them out to play the whole file.
window.__musicPrivate = [
  { decade: '1980s', file: '鄧麗君 - 望春風.m4a',        title: '望春風',        artist: '鄧麗君', year: 1980, start: 56,  end: 96 },
  { decade: '1980s', file: '王芷蕾 - 台北的天空.m4a',     title: '台北的天空',     artist: '王芷蕾', year: 1985 },
  { decade: '1980s', file: '張雨生 - 我的未來不是夢.m4a', title: '我的未來不是夢', artist: '張雨生', year: 1988, start: 100, end: 142 },
  { decade: '1990s', file: '張學友 - 吻別.m4a',          title: '吻別',          artist: '張學友', year: 1993 },
  { decade: '2000s', file: '周杰倫 - 七里香.m4a',        title: '七里香',        artist: '周杰倫', year: 2004, start: 80,  end: 118 },
  { decade: '2010s', file: '五月天 - 後來的我們.m4a',     title: '後來的我們',     artist: '五月天', year: 2016 },
];
