# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint-1.spec.ts >> CP-08 — Columnas de fin de semana tienen fondo azul claro
- Location: tests/e2e/sprint-1.spec.ts:186:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/"
Received: "http://localhost:3000/login"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    8 × unexpected value "http://localhost:3000/login"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - heading "Gestor de Cuadrantes" [level=1] [ref=e5]
        - navigation [ref=e6]:
          - link "Cuadrante" [ref=e7] [cursor=pointer]:
            - /url: /
          - link "Empleados" [ref=e8] [cursor=pointer]:
            - /url: /employees
          - link "Ayuda" [ref=e9] [cursor=pointer]:
            - /url: /info
      - generic [ref=e10]:
        - generic [ref=e11]: admin@cuadrantes.localSUPER_ADMIN
        - button "Cerrar sesión" [ref=e12]
    - main [ref=e13]:
      - generic [ref=e14]:
        - button "‹" [ref=e15]
        - heading "Mayo 2026" [level=2] [ref=e16]
        - button "›" [ref=e17]
        - generic [ref=e18]: Modo edición — clic en celda para asignar turno
        - button "Generar cuadrante" [ref=e19]
        - button "Exportar CSV" [ref=e20]
        - button "Imprimir" [ref=e21]
        - button "Festivos" [ref=e22]
      - table [ref=e24]:
        - rowgroup [ref=e25]:
          - row "Empleado 1 V 2 S 3 D 4 L 5 M 6 X 7 J 8 V 9 S 10 D 11 L 12 M 13 X 14 J 15 V 16 S 17 D 18 L 19 M 20 X 21 J 22 V 23 S 24 D 25 L 26 M 27 X 28 J 29 V 30 S 31 D Contadores" [ref=e26]:
            - columnheader "Empleado" [ref=e27]
            - columnheader "1 V" [ref=e28]:
              - generic [ref=e29]: "1"
              - generic [ref=e30]: V
            - columnheader "2 S" [ref=e31]:
              - generic [ref=e32]: "2"
              - generic [ref=e33]: S
            - columnheader "3 D" [ref=e34]:
              - generic [ref=e35]: "3"
              - generic [ref=e36]: D
            - columnheader "4 L" [ref=e37]:
              - generic [ref=e38]: "4"
              - generic [ref=e39]: L
            - columnheader "5 M" [ref=e40]:
              - generic [ref=e41]: "5"
              - generic [ref=e42]: M
            - columnheader "6 X" [ref=e43]:
              - generic [ref=e44]: "6"
              - generic [ref=e45]: X
            - columnheader "7 J" [ref=e46]:
              - generic [ref=e47]: "7"
              - generic [ref=e48]: J
            - columnheader "8 V" [ref=e49]:
              - generic [ref=e50]: "8"
              - generic [ref=e51]: V
            - columnheader "9 S" [ref=e52]:
              - generic [ref=e53]: "9"
              - generic [ref=e54]: S
            - columnheader "10 D" [ref=e55]:
              - generic [ref=e56]: "10"
              - generic [ref=e57]: D
            - columnheader "11 L" [ref=e58]:
              - generic [ref=e59]: "11"
              - generic [ref=e60]: L
            - columnheader "12 M" [ref=e61]:
              - generic [ref=e62]: "12"
              - generic [ref=e63]: M
            - columnheader "13 X" [ref=e64]:
              - generic [ref=e65]: "13"
              - generic [ref=e66]: X
            - columnheader "14 J" [ref=e67]:
              - generic [ref=e68]: "14"
              - generic [ref=e69]: J
            - columnheader "15 V" [ref=e70]:
              - generic [ref=e71]: "15"
              - generic [ref=e72]: V
            - columnheader "16 S" [ref=e73]:
              - generic [ref=e74]: "16"
              - generic [ref=e75]: S
            - columnheader "17 D" [ref=e76]:
              - generic [ref=e77]: "17"
              - generic [ref=e78]: D
            - columnheader "18 L" [ref=e79]:
              - generic [ref=e80]: "18"
              - generic [ref=e81]: L
            - columnheader "19 M" [ref=e82]:
              - generic [ref=e83]: "19"
              - generic [ref=e84]: M
            - columnheader "20 X" [ref=e85]:
              - generic [ref=e86]: "20"
              - generic [ref=e87]: X
            - columnheader "21 J" [ref=e88]:
              - generic [ref=e89]: "21"
              - generic [ref=e90]: J
            - columnheader "22 V" [ref=e91]:
              - generic [ref=e92]: "22"
              - generic [ref=e93]: V
            - columnheader "23 S" [ref=e94]:
              - generic [ref=e95]: "23"
              - generic [ref=e96]: S
            - columnheader "24 D" [ref=e97]:
              - generic [ref=e98]: "24"
              - generic [ref=e99]: D
            - columnheader "25 L" [ref=e100]:
              - generic [ref=e101]: "25"
              - generic [ref=e102]: L
            - columnheader "26 M" [ref=e103]:
              - generic [ref=e104]: "26"
              - generic [ref=e105]: M
            - columnheader "27 X" [ref=e106]:
              - generic [ref=e107]: "27"
              - generic [ref=e108]: X
            - columnheader "28 J" [ref=e109]:
              - generic [ref=e110]: "28"
              - generic [ref=e111]: J
            - columnheader "29 V" [ref=e112]:
              - generic [ref=e113]: "29"
              - generic [ref=e114]: V
            - columnheader "30 S" [ref=e115]:
              - generic [ref=e116]: "30"
              - generic [ref=e117]: S
            - columnheader "31 D" [ref=e118]:
              - generic [ref=e119]: "31"
              - generic [ref=e120]: D
            - columnheader "Contadores" [ref=e121]
        - rowgroup [ref=e122]:
          - row "Técnico 1 M T N D D T T T D D N N N D D M M M D D T T T D D N N N D D M M:5 T:7 N:7 D:12" [ref=e123]:
            - cell "Técnico 1" [ref=e124]
            - cell "M" [ref=e125] [cursor=pointer]:
              - generic "Mañana" [ref=e126]: M
            - cell "T" [ref=e127] [cursor=pointer]:
              - generic "Tarde" [ref=e128]: T
            - cell "N" [ref=e129] [cursor=pointer]:
              - generic "Noche" [ref=e130]: "N"
            - cell "D" [ref=e131] [cursor=pointer]:
              - generic "Descanso" [ref=e132]: D
            - cell "D" [ref=e133] [cursor=pointer]:
              - generic "Descanso" [ref=e134]: D
            - cell "T" [ref=e135] [cursor=pointer]:
              - generic "Tarde" [ref=e136]: T
            - cell "T" [ref=e137] [cursor=pointer]:
              - generic "Tarde" [ref=e138]: T
            - cell "T" [ref=e139] [cursor=pointer]:
              - generic "Tarde" [ref=e140]: T
            - cell "D" [ref=e141] [cursor=pointer]:
              - generic "Descanso" [ref=e142]: D
            - cell "D" [ref=e143] [cursor=pointer]:
              - generic "Descanso" [ref=e144]: D
            - cell "N" [ref=e145] [cursor=pointer]:
              - generic "Noche" [ref=e146]: "N"
            - cell "N" [ref=e147] [cursor=pointer]:
              - generic "Noche" [ref=e148]: "N"
            - cell "N" [ref=e149] [cursor=pointer]:
              - generic "Noche" [ref=e150]: "N"
            - cell "D" [ref=e151] [cursor=pointer]:
              - generic "Descanso" [ref=e152]: D
            - cell "D" [ref=e153] [cursor=pointer]:
              - generic "Descanso" [ref=e154]: D
            - cell "M" [ref=e155] [cursor=pointer]:
              - generic "Mañana" [ref=e156]: M
            - cell "M" [ref=e157] [cursor=pointer]:
              - generic "Mañana" [ref=e158]: M
            - cell "M" [ref=e159] [cursor=pointer]:
              - generic "Mañana" [ref=e160]: M
            - cell "D" [ref=e161] [cursor=pointer]:
              - generic "Descanso" [ref=e162]: D
            - cell "D" [ref=e163] [cursor=pointer]:
              - generic "Descanso" [ref=e164]: D
            - cell "T" [ref=e165] [cursor=pointer]:
              - generic "Tarde" [ref=e166]: T
            - cell "T" [ref=e167] [cursor=pointer]:
              - generic "Tarde" [ref=e168]: T
            - cell "T" [ref=e169] [cursor=pointer]:
              - generic "Tarde" [ref=e170]: T
            - cell "D" [ref=e171] [cursor=pointer]:
              - generic "Descanso" [ref=e172]: D
            - cell "D" [ref=e173] [cursor=pointer]:
              - generic "Descanso" [ref=e174]: D
            - cell "N" [ref=e175] [cursor=pointer]:
              - generic "Noche" [ref=e176]: "N"
            - cell "N" [ref=e177] [cursor=pointer]:
              - generic "Noche" [ref=e178]: "N"
            - cell "N" [ref=e179] [cursor=pointer]:
              - generic "Noche" [ref=e180]: "N"
            - cell "D" [ref=e181] [cursor=pointer]:
              - generic "Descanso" [ref=e182]: D
            - cell "D" [ref=e183] [cursor=pointer]:
              - generic "Descanso" [ref=e184]: D
            - cell "M" [ref=e185] [cursor=pointer]:
              - generic "Mañana" [ref=e186]: M
            - cell "M:5 T:7 N:7 D:12" [ref=e187]:
              - generic [ref=e188]:
                - generic [ref=e189]: M:5
                - generic [ref=e190]: T:7
                - generic [ref=e191]: N:7
                - generic [ref=e192]: D:12
          - row "Técnico 2 T T T D D N N N D D M M M D D T T T D D N N N D D M M M D D T M:6 T:7 N:6 D:12" [ref=e193]:
            - cell "Técnico 2" [ref=e194]
            - cell "T" [ref=e195] [cursor=pointer]:
              - generic "Tarde" [ref=e196]: T
            - cell "T" [ref=e197] [cursor=pointer]:
              - generic "Tarde" [ref=e198]: T
            - cell "T" [ref=e199] [cursor=pointer]:
              - generic "Tarde" [ref=e200]: T
            - cell "D" [ref=e201] [cursor=pointer]:
              - generic "Descanso" [ref=e202]: D
            - cell "D" [ref=e203] [cursor=pointer]:
              - generic "Descanso" [ref=e204]: D
            - cell "N" [ref=e205] [cursor=pointer]:
              - generic "Noche" [ref=e206]: "N"
            - cell "N" [ref=e207] [cursor=pointer]:
              - generic "Noche" [ref=e208]: "N"
            - cell "N" [ref=e209] [cursor=pointer]:
              - generic "Noche" [ref=e210]: "N"
            - cell "D" [ref=e211] [cursor=pointer]:
              - generic "Descanso" [ref=e212]: D
            - cell "D" [ref=e213] [cursor=pointer]:
              - generic "Descanso" [ref=e214]: D
            - cell "M" [ref=e215] [cursor=pointer]:
              - generic "Mañana" [ref=e216]: M
            - cell "M" [ref=e217] [cursor=pointer]:
              - generic "Mañana" [ref=e218]: M
            - cell "M" [ref=e219] [cursor=pointer]:
              - generic "Mañana" [ref=e220]: M
            - cell "D" [ref=e221] [cursor=pointer]:
              - generic "Descanso" [ref=e222]: D
            - cell "D" [ref=e223] [cursor=pointer]:
              - generic "Descanso" [ref=e224]: D
            - cell "T" [ref=e225] [cursor=pointer]:
              - generic "Tarde" [ref=e226]: T
            - cell "T" [ref=e227] [cursor=pointer]:
              - generic "Tarde" [ref=e228]: T
            - cell "T" [ref=e229] [cursor=pointer]:
              - generic "Tarde" [ref=e230]: T
            - cell "D" [ref=e231] [cursor=pointer]:
              - generic "Descanso" [ref=e232]: D
            - cell "D" [ref=e233] [cursor=pointer]:
              - generic "Descanso" [ref=e234]: D
            - cell "N" [ref=e235] [cursor=pointer]:
              - generic "Noche" [ref=e236]: "N"
            - cell "N" [ref=e237] [cursor=pointer]:
              - generic "Noche" [ref=e238]: "N"
            - cell "N" [ref=e239] [cursor=pointer]:
              - generic "Noche" [ref=e240]: "N"
            - cell "D" [ref=e241] [cursor=pointer]:
              - generic "Descanso" [ref=e242]: D
            - cell "D" [ref=e243] [cursor=pointer]:
              - generic "Descanso" [ref=e244]: D
            - cell "M" [ref=e245] [cursor=pointer]:
              - generic "Mañana" [ref=e246]: M
            - cell "M" [ref=e247] [cursor=pointer]:
              - generic "Mañana" [ref=e248]: M
            - cell "M" [ref=e249] [cursor=pointer]:
              - generic "Mañana" [ref=e250]: M
            - cell "D" [ref=e251] [cursor=pointer]:
              - generic "Descanso" [ref=e252]: D
            - cell "D" [ref=e253] [cursor=pointer]:
              - generic "Descanso" [ref=e254]: D
            - cell "T" [ref=e255] [cursor=pointer]:
              - generic "Tarde" [ref=e256]: T
            - cell "M:6 T:7 N:6 D:12" [ref=e257]:
              - generic [ref=e258]:
                - generic [ref=e259]: M:6
                - generic [ref=e260]: T:7
                - generic [ref=e261]: N:6
                - generic [ref=e262]: D:12
          - row "Técnico 3 N N N D D M M M D D T T T D D N N N D D M M M D D T T T D D N M:6 T:6 N:7 D:12" [ref=e263]:
            - cell "Técnico 3" [ref=e264]
            - cell "N" [ref=e265] [cursor=pointer]:
              - generic "Noche" [ref=e266]: "N"
            - cell "N" [ref=e267] [cursor=pointer]:
              - generic "Noche" [ref=e268]: "N"
            - cell "N" [ref=e269] [cursor=pointer]:
              - generic "Noche" [ref=e270]: "N"
            - cell "D" [ref=e271] [cursor=pointer]:
              - generic "Descanso" [ref=e272]: D
            - cell "D" [ref=e273] [cursor=pointer]:
              - generic "Descanso" [ref=e274]: D
            - cell "M" [ref=e275] [cursor=pointer]:
              - generic "Mañana" [ref=e276]: M
            - cell "M" [ref=e277] [cursor=pointer]:
              - generic "Mañana" [ref=e278]: M
            - cell "M" [ref=e279] [cursor=pointer]:
              - generic "Mañana" [ref=e280]: M
            - cell "D" [ref=e281] [cursor=pointer]:
              - generic "Descanso" [ref=e282]: D
            - cell "D" [ref=e283] [cursor=pointer]:
              - generic "Descanso" [ref=e284]: D
            - cell "T" [ref=e285] [cursor=pointer]:
              - generic "Tarde" [ref=e286]: T
            - cell "T" [ref=e287] [cursor=pointer]:
              - generic "Tarde" [ref=e288]: T
            - cell "T" [ref=e289] [cursor=pointer]:
              - generic "Tarde" [ref=e290]: T
            - cell "D" [ref=e291] [cursor=pointer]:
              - generic "Descanso" [ref=e292]: D
            - cell "D" [ref=e293] [cursor=pointer]:
              - generic "Descanso" [ref=e294]: D
            - cell "N" [ref=e295] [cursor=pointer]:
              - generic "Noche" [ref=e296]: "N"
            - cell "N" [ref=e297] [cursor=pointer]:
              - generic "Noche" [ref=e298]: "N"
            - cell "N" [ref=e299] [cursor=pointer]:
              - generic "Noche" [ref=e300]: "N"
            - cell "D" [ref=e301] [cursor=pointer]:
              - generic "Descanso" [ref=e302]: D
            - cell "D" [ref=e303] [cursor=pointer]:
              - generic "Descanso" [ref=e304]: D
            - cell "M" [ref=e305] [cursor=pointer]:
              - generic "Mañana" [ref=e306]: M
            - cell "M" [ref=e307] [cursor=pointer]:
              - generic "Mañana" [ref=e308]: M
            - cell "M" [ref=e309] [cursor=pointer]:
              - generic "Mañana" [ref=e310]: M
            - cell "D" [ref=e311] [cursor=pointer]:
              - generic "Descanso" [ref=e312]: D
            - cell "D" [ref=e313] [cursor=pointer]:
              - generic "Descanso" [ref=e314]: D
            - cell "T" [ref=e315] [cursor=pointer]:
              - generic "Tarde" [ref=e316]: T
            - cell "T" [ref=e317] [cursor=pointer]:
              - generic "Tarde" [ref=e318]: T
            - cell "T" [ref=e319] [cursor=pointer]:
              - generic "Tarde" [ref=e320]: T
            - cell "D" [ref=e321] [cursor=pointer]:
              - generic "Descanso" [ref=e322]: D
            - cell "D" [ref=e323] [cursor=pointer]:
              - generic "Descanso" [ref=e324]: D
            - cell "N" [ref=e325] [cursor=pointer]:
              - generic "Noche" [ref=e326]: "N"
            - cell "M:6 T:6 N:7 D:12" [ref=e327]:
              - generic [ref=e328]:
                - generic [ref=e329]: M:6
                - generic [ref=e330]: T:6
                - generic [ref=e331]: N:7
                - generic [ref=e332]: D:12
          - row "Técnico 4 J J J J J D D J J J J J D D J J J J J D D J J J J J D D J J J:22 D:8" [ref=e333]:
            - cell "Técnico 4" [ref=e334]
            - cell "J" [ref=e335] [cursor=pointer]:
              - generic "Jornada normal" [ref=e336]: J
            - cell "J" [ref=e337] [cursor=pointer]:
              - generic "Jornada normal" [ref=e338]: J
            - cell "J" [ref=e339] [cursor=pointer]:
              - generic "Jornada normal" [ref=e340]: J
            - cell "J" [ref=e341] [cursor=pointer]:
              - generic "Jornada normal" [ref=e342]: J
            - cell "J" [ref=e343] [cursor=pointer]:
              - generic "Jornada normal" [ref=e344]: J
            - cell "D" [ref=e345] [cursor=pointer]:
              - generic "Descanso" [ref=e346]: D
            - cell "D" [ref=e347] [cursor=pointer]:
              - generic "Descanso" [ref=e348]: D
            - cell "J" [ref=e349] [cursor=pointer]:
              - generic "Jornada normal" [ref=e350]: J
            - cell "J" [ref=e351] [cursor=pointer]:
              - generic "Jornada normal" [ref=e352]: J
            - cell "J" [ref=e353] [cursor=pointer]:
              - generic "Jornada normal" [ref=e354]: J
            - cell "J" [ref=e355] [cursor=pointer]:
              - generic "Jornada normal" [ref=e356]: J
            - cell "J" [ref=e357] [cursor=pointer]:
              - generic "Jornada normal" [ref=e358]: J
            - cell "D" [ref=e359] [cursor=pointer]:
              - generic "Descanso" [ref=e360]: D
            - cell "D" [ref=e361] [cursor=pointer]:
              - generic "Descanso" [ref=e362]: D
            - cell "J" [ref=e363] [cursor=pointer]:
              - generic "Jornada normal" [ref=e364]: J
            - cell "J" [ref=e365] [cursor=pointer]:
              - generic "Jornada normal" [ref=e366]: J
            - cell "J" [ref=e367] [cursor=pointer]:
              - generic "Jornada normal" [ref=e368]: J
            - cell "J" [ref=e369] [cursor=pointer]:
              - generic "Jornada normal" [ref=e370]: J
            - cell "J" [ref=e371] [cursor=pointer]:
              - generic "Jornada normal" [ref=e372]: J
            - cell "D" [ref=e373] [cursor=pointer]:
              - generic "Descanso" [ref=e374]: D
            - cell "D" [ref=e375] [cursor=pointer]:
              - generic "Descanso" [ref=e376]: D
            - cell "J" [ref=e377] [cursor=pointer]:
              - generic "Jornada normal" [ref=e378]: J
            - cell "J" [ref=e379] [cursor=pointer]:
              - generic "Jornada normal" [ref=e380]: J
            - cell "J" [ref=e381] [cursor=pointer]:
              - generic "Jornada normal" [ref=e382]: J
            - cell "J" [ref=e383] [cursor=pointer]:
              - generic "Jornada normal" [ref=e384]: J
            - cell "J" [ref=e385] [cursor=pointer]:
              - generic "Jornada normal" [ref=e386]: J
            - cell "D" [ref=e387] [cursor=pointer]:
              - generic "Descanso" [ref=e388]: D
            - cell "D" [ref=e389] [cursor=pointer]:
              - generic "Descanso" [ref=e390]: D
            - cell "J" [ref=e391] [cursor=pointer]:
              - generic "Jornada normal" [ref=e392]: J
            - cell "J" [ref=e393] [cursor=pointer]:
              - generic "Jornada normal" [ref=e394]: J
            - cell [ref=e395] [cursor=pointer]
            - cell "J:22 D:8" [ref=e396]:
              - generic [ref=e397]:
                - generic [ref=e398]: J:22
                - generic [ref=e399]: D:8
          - row "Técnico 5 M M M D D T T T D D V V V V V D D M M M D D T T T D D N N N D M:6 T:6 N:3 D:11 V:5" [ref=e400]:
            - cell "Técnico 5" [ref=e401]
            - cell "M" [ref=e402] [cursor=pointer]:
              - generic "Mañana" [ref=e403]: M
            - cell "M" [ref=e404] [cursor=pointer]:
              - generic "Mañana" [ref=e405]: M
            - cell "M" [ref=e406] [cursor=pointer]:
              - generic "Mañana" [ref=e407]: M
            - cell "D" [ref=e408] [cursor=pointer]:
              - generic "Descanso" [ref=e409]: D
            - cell "D" [ref=e410] [cursor=pointer]:
              - generic "Descanso" [ref=e411]: D
            - cell "T" [ref=e412] [cursor=pointer]:
              - generic "Tarde" [ref=e413]: T
            - cell "T" [ref=e414] [cursor=pointer]:
              - generic "Tarde" [ref=e415]: T
            - cell "T" [ref=e416] [cursor=pointer]:
              - generic "Tarde" [ref=e417]: T
            - cell "D" [ref=e418] [cursor=pointer]:
              - generic "Descanso" [ref=e419]: D
            - cell "D" [ref=e420] [cursor=pointer]:
              - generic "Descanso" [ref=e421]: D
            - cell "V" [ref=e422] [cursor=pointer]:
              - generic "Vacaciones" [ref=e423]: V
            - cell "V" [ref=e424] [cursor=pointer]:
              - generic "Vacaciones" [ref=e425]: V
            - cell "V" [ref=e426] [cursor=pointer]:
              - generic "Vacaciones" [ref=e427]: V
            - cell "V" [ref=e428] [cursor=pointer]:
              - generic "Vacaciones" [ref=e429]: V
            - cell "V" [ref=e430] [cursor=pointer]:
              - generic "Vacaciones" [ref=e431]: V
            - cell "D" [ref=e432] [cursor=pointer]:
              - generic "Descanso" [ref=e433]: D
            - cell "D" [ref=e434] [cursor=pointer]:
              - generic "Descanso" [ref=e435]: D
            - cell "M" [ref=e436] [cursor=pointer]:
              - generic "Mañana" [ref=e437]: M
            - cell "M" [ref=e438] [cursor=pointer]:
              - generic "Mañana" [ref=e439]: M
            - cell "M" [ref=e440] [cursor=pointer]:
              - generic "Mañana" [ref=e441]: M
            - cell "D" [ref=e442] [cursor=pointer]:
              - generic "Descanso" [ref=e443]: D
            - cell "D" [ref=e444] [cursor=pointer]:
              - generic "Descanso" [ref=e445]: D
            - cell "T" [ref=e446] [cursor=pointer]:
              - generic "Tarde" [ref=e447]: T
            - cell "T" [ref=e448] [cursor=pointer]:
              - generic "Tarde" [ref=e449]: T
            - cell "T" [ref=e450] [cursor=pointer]:
              - generic "Tarde" [ref=e451]: T
            - cell "D" [ref=e452] [cursor=pointer]:
              - generic "Descanso" [ref=e453]: D
            - cell "D" [ref=e454] [cursor=pointer]:
              - generic "Descanso" [ref=e455]: D
            - cell "N" [ref=e456] [cursor=pointer]:
              - generic "Noche" [ref=e457]: "N"
            - cell "N" [ref=e458] [cursor=pointer]:
              - generic "Noche" [ref=e459]: "N"
            - cell "N" [ref=e460] [cursor=pointer]:
              - generic "Noche" [ref=e461]: "N"
            - cell "D" [ref=e462] [cursor=pointer]:
              - generic "Descanso" [ref=e463]: D
            - cell "M:6 T:6 N:3 D:11 V:5" [ref=e464]:
              - generic [ref=e465]:
                - generic [ref=e466]: M:6
                - generic [ref=e467]: T:6
                - generic [ref=e468]: N:3
                - generic [ref=e469]: D:11
                - generic [ref=e470]: V:5
          - row "Técnico 6 B B B B B D D T T T D D N N N D D M M M D D T T T D D N N N D M:3 T:6 N:6 D:11 B:5" [ref=e471]:
            - cell "Técnico 6" [ref=e472]
            - cell "B" [ref=e473] [cursor=pointer]:
              - generic "Baja" [ref=e474]: B
            - cell "B" [ref=e475] [cursor=pointer]:
              - generic "Baja" [ref=e476]: B
            - cell "B" [ref=e477] [cursor=pointer]:
              - generic "Baja" [ref=e478]: B
            - cell "B" [ref=e479] [cursor=pointer]:
              - generic "Baja" [ref=e480]: B
            - cell "B" [ref=e481] [cursor=pointer]:
              - generic "Baja" [ref=e482]: B
            - cell "D" [ref=e483] [cursor=pointer]:
              - generic "Descanso" [ref=e484]: D
            - cell "D" [ref=e485] [cursor=pointer]:
              - generic "Descanso" [ref=e486]: D
            - cell "T" [ref=e487] [cursor=pointer]:
              - generic "Tarde" [ref=e488]: T
            - cell "T" [ref=e489] [cursor=pointer]:
              - generic "Tarde" [ref=e490]: T
            - cell "T" [ref=e491] [cursor=pointer]:
              - generic "Tarde" [ref=e492]: T
            - cell "D" [ref=e493] [cursor=pointer]:
              - generic "Descanso" [ref=e494]: D
            - cell "D" [ref=e495] [cursor=pointer]:
              - generic "Descanso" [ref=e496]: D
            - cell "N" [ref=e497] [cursor=pointer]:
              - generic "Noche" [ref=e498]: "N"
            - cell "N" [ref=e499] [cursor=pointer]:
              - generic "Noche" [ref=e500]: "N"
            - cell "N" [ref=e501] [cursor=pointer]:
              - generic "Noche" [ref=e502]: "N"
            - cell "D" [ref=e503] [cursor=pointer]:
              - generic "Descanso" [ref=e504]: D
            - cell "D" [ref=e505] [cursor=pointer]:
              - generic "Descanso" [ref=e506]: D
            - cell "M" [ref=e507] [cursor=pointer]:
              - generic "Mañana" [ref=e508]: M
            - cell "M" [ref=e509] [cursor=pointer]:
              - generic "Mañana" [ref=e510]: M
            - cell "M" [ref=e511] [cursor=pointer]:
              - generic "Mañana" [ref=e512]: M
            - cell "D" [ref=e513] [cursor=pointer]:
              - generic "Descanso" [ref=e514]: D
            - cell "D" [ref=e515] [cursor=pointer]:
              - generic "Descanso" [ref=e516]: D
            - cell "T" [ref=e517] [cursor=pointer]:
              - generic "Tarde" [ref=e518]: T
            - cell "T" [ref=e519] [cursor=pointer]:
              - generic "Tarde" [ref=e520]: T
            - cell "T" [ref=e521] [cursor=pointer]:
              - generic "Tarde" [ref=e522]: T
            - cell "D" [ref=e523] [cursor=pointer]:
              - generic "Descanso" [ref=e524]: D
            - cell "D" [ref=e525] [cursor=pointer]:
              - generic "Descanso" [ref=e526]: D
            - cell "N" [ref=e527] [cursor=pointer]:
              - generic "Noche" [ref=e528]: "N"
            - cell "N" [ref=e529] [cursor=pointer]:
              - generic "Noche" [ref=e530]: "N"
            - cell "N" [ref=e531] [cursor=pointer]:
              - generic "Noche" [ref=e532]: "N"
            - cell "D" [ref=e533] [cursor=pointer]:
              - generic "Descanso" [ref=e534]: D
            - cell "M:3 T:6 N:6 D:11 B:5" [ref=e535]:
              - generic [ref=e536]:
                - generic [ref=e537]: M:3
                - generic [ref=e538]: T:6
                - generic [ref=e539]: N:6
                - generic [ref=e540]: D:11
                - generic [ref=e541]: B:5
          - row "Técnico 7 M T N J D V B M T N J D V B M T N J D V B M T N J D V B M T D M:5 T:5 N:4 J:4 D:5 V:4 B:4" [ref=e542]:
            - cell "Técnico 7" [ref=e543]
            - cell "M" [ref=e544] [cursor=pointer]:
              - generic "Mañana" [ref=e545]: M
            - cell "T" [ref=e546] [cursor=pointer]:
              - generic "Tarde" [ref=e547]: T
            - cell "N" [ref=e548] [cursor=pointer]:
              - generic "Noche" [ref=e549]: "N"
            - cell "J" [ref=e550] [cursor=pointer]:
              - generic "Jornada normal" [ref=e551]: J
            - cell "D" [ref=e552] [cursor=pointer]:
              - generic "Descanso" [ref=e553]: D
            - cell "V" [ref=e554] [cursor=pointer]:
              - generic "Vacaciones" [ref=e555]: V
            - cell "B" [ref=e556] [cursor=pointer]:
              - generic "Baja" [ref=e557]: B
            - cell "M" [ref=e558] [cursor=pointer]:
              - generic "Mañana" [ref=e559]: M
            - cell "T" [ref=e560] [cursor=pointer]:
              - generic "Tarde" [ref=e561]: T
            - cell "N" [ref=e562] [cursor=pointer]:
              - generic "Noche" [ref=e563]: "N"
            - cell "J" [ref=e564] [cursor=pointer]:
              - generic "Jornada normal" [ref=e565]: J
            - cell "D" [ref=e566] [cursor=pointer]:
              - generic "Descanso" [ref=e567]: D
            - cell "V" [ref=e568] [cursor=pointer]:
              - generic "Vacaciones" [ref=e569]: V
            - cell "B" [ref=e570] [cursor=pointer]:
              - generic "Baja" [ref=e571]: B
            - cell "M" [ref=e572] [cursor=pointer]:
              - generic "Mañana" [ref=e573]: M
            - cell "T" [ref=e574] [cursor=pointer]:
              - generic "Tarde" [ref=e575]: T
            - cell "N" [ref=e576] [cursor=pointer]:
              - generic "Noche" [ref=e577]: "N"
            - cell "J" [ref=e578] [cursor=pointer]:
              - generic "Jornada normal" [ref=e579]: J
            - cell "D" [ref=e580] [cursor=pointer]:
              - generic "Descanso" [ref=e581]: D
            - cell "V" [ref=e582] [cursor=pointer]:
              - generic "Vacaciones" [ref=e583]: V
            - cell "B" [ref=e584] [cursor=pointer]:
              - generic "Baja" [ref=e585]: B
            - cell "M" [ref=e586] [cursor=pointer]:
              - generic "Mañana" [ref=e587]: M
            - cell "T" [ref=e588] [cursor=pointer]:
              - generic "Tarde" [ref=e589]: T
            - cell "N" [ref=e590] [cursor=pointer]:
              - generic "Noche" [ref=e591]: "N"
            - cell "J" [ref=e592] [cursor=pointer]:
              - generic "Jornada normal" [ref=e593]: J
            - cell "D" [ref=e594] [cursor=pointer]:
              - generic "Descanso" [ref=e595]: D
            - cell "V" [ref=e596] [cursor=pointer]:
              - generic "Vacaciones" [ref=e597]: V
            - cell "B" [ref=e598] [cursor=pointer]:
              - generic "Baja" [ref=e599]: B
            - cell "M" [ref=e600] [cursor=pointer]:
              - generic "Mañana" [ref=e601]: M
            - cell "T" [ref=e602] [cursor=pointer]:
              - generic "Tarde" [ref=e603]: T
            - cell "D" [ref=e604] [cursor=pointer]:
              - generic "Descanso" [ref=e605]: D
            - cell "M:5 T:5 N:4 J:4 D:5 V:4 B:4" [ref=e606]:
              - generic [ref=e607]:
                - generic [ref=e608]: M:5
                - generic [ref=e609]: T:5
                - generic [ref=e610]: N:4
                - generic [ref=e611]: J:4
                - generic [ref=e612]: D:5
                - generic [ref=e613]: V:4
                - generic [ref=e614]: B:4
      - generic [ref=e615]:
        - generic [ref=e616]:
          - generic [ref=e617]: M
          - generic [ref=e618]: Mañana
        - generic [ref=e619]:
          - generic [ref=e620]: T
          - generic [ref=e621]: Tarde
        - generic [ref=e622]:
          - generic [ref=e623]: "N"
          - generic [ref=e624]: Noche
        - generic [ref=e625]:
          - generic [ref=e626]: J
          - generic [ref=e627]: Jornada normal
        - generic [ref=e628]:
          - generic [ref=e629]: D
          - generic [ref=e630]: Descanso
        - generic [ref=e631]:
          - generic [ref=e632]: V
          - generic [ref=e633]: Vacaciones
        - generic [ref=e634]:
          - generic [ref=e635]: B
          - generic [ref=e636]: Baja
  - button "Open Next.js Dev Tools" [ref=e642] [cursor=pointer]:
    - img [ref=e643]
  - alert [ref=e646]
```

# Test source

```ts
  89  |     await screenshotOnFail(page, "CP-03");
  90  |     throw e;
  91  |   }
  92  | });
  93  | 
  94  | // ===========================================================================
  95  | // CP-04 — Login técnico correcto
  96  | // ===========================================================================
  97  | test("CP-04 — Login técnico correcto muestra badge USER", async ({ page }) => {
  98  |   try {
  99  |     await login(page, TECH_EMAIL, TECH_PASSWORD);
  100 | 
  101 |     await expect(page).toHaveURL("/");
  102 |     await expect(page.getByText("USER")).toBeVisible();
  103 |   } catch (e) {
  104 |     await screenshotOnFail(page, "CP-04");
  105 |     throw e;
  106 |   }
  107 | });
  108 | 
  109 | // ===========================================================================
  110 | // CP-05 — Vista del cuadrante: grid con empleados y 31 columnas
  111 | // ===========================================================================
  112 | test("CP-05 — Vista del cuadrante muestra grid de 8 empleados y 31 días", async ({ page }) => {
  113 |   try {
  114 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  115 |     await expect(page).toHaveURL("/");
  116 | 
  117 |     const table = page.locator("table");
  118 |     await expect(table).toBeVisible();
  119 | 
  120 |     // Al menos 7 filas de datos (tbody tr) — el seed crea 7 técnicos con turnos de Mayo 2026
  121 |     const rows = page.locator("tbody tr");
  122 |     const rowCount = await rows.count();
  123 |     expect(rowCount).toBeGreaterThanOrEqual(7);
  124 | 
  125 |     // 31 celdas de día en la primera fila + columna nombre + columna contadores = 33 th en el header
  126 |     const headerCells = page.locator("thead tr th");
  127 |     await expect(headerCells).toHaveCount(33); // 1 nombre + 31 días + 1 contadores
  128 |   } catch (e) {
  129 |     await screenshotOnFail(page, "CP-05");
  130 |     throw e;
  131 |   }
  132 | });
  133 | 
  134 | // ===========================================================================
  135 | // CP-06 — Colores de turno correctos
  136 | // ===========================================================================
  137 | test("CP-06 — Colores de turno coinciden con la paleta definida", async ({ page }) => {
  138 |   try {
  139 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  140 |     await expect(page).toHaveURL("/");
  141 | 
  142 |     // Verificamos cada color buscando una celda con ese código en la leyenda
  143 |     for (const [shiftCode, expectedColor] of Object.entries(SHIFT_COLORS)) {
  144 |       const legendCell = page
  145 |         .locator(`div.mt-6 span`)
  146 |         .filter({ hasText: new RegExp(`^${shiftCode}$`) })
  147 |         .first();
  148 | 
  149 |       await expect(legendCell).toBeVisible();
  150 |       await expect(legendCell).toHaveCSS("background-color", expectedColor);
  151 |     }
  152 |   } catch (e) {
  153 |     await screenshotOnFail(page, "CP-06");
  154 |     throw e;
  155 |   }
  156 | });
  157 | 
  158 | // ===========================================================================
  159 | // CP-07 — Contadores de turno en formato "Turno:N"
  160 | // ===========================================================================
  161 | test("CP-07 — Contadores de turno visibles en formato Turno:N", async ({ page }) => {
  162 |   try {
  163 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  164 |     await expect(page).toHaveURL("/");
  165 | 
  166 |     // La primera fila de datos (Admin) debe tener contadores J: (jornada normal)
  167 |     const firstRowCounters = page.locator("tbody tr").first().locator("td").last();
  168 |     await expect(firstRowCounters).toBeVisible();
  169 | 
  170 |     // Verificar que al menos un badge tiene formato X:N
  171 |     const badges = firstRowCounters.locator("span");
  172 |     const count = await badges.count();
  173 |     expect(count).toBeGreaterThan(0);
  174 | 
  175 |     const firstBadgeText = await badges.first().textContent();
  176 |     expect(firstBadgeText).toMatch(/^[MTNJDVB]{1,2}:\d+$/);
  177 |   } catch (e) {
  178 |     await screenshotOnFail(page, "CP-07");
  179 |     throw e;
  180 |   }
  181 | });
  182 | 
  183 | // ===========================================================================
  184 | // CP-08 — Fines de semana resaltados en el encabezado
  185 | // ===========================================================================
  186 | test("CP-08 — Columnas de fin de semana tienen fondo azul claro", async ({ page }) => {
  187 |   try {
  188 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
> 189 |     await expect(page).toHaveURL("/");
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  190 | 
  191 |     // Mayo 2026: día 2 (sábado) y día 3 (domingo) son fines de semana
  192 |     // Los th de fines de semana tienen clase bg-blue-50
  193 |     const weekendHeaders = page.locator("thead tr th.bg-blue-50, thead tr th[class*='bg-blue']");
  194 |     const count = await weekendHeaders.count();
  195 |     // Mayo 2026 tiene 8 fines de semana + 1 = 9 días (4 sábados + 5 domingos = 9, o 5+4=9)
  196 |     expect(count).toBeGreaterThanOrEqual(8);
  197 |   } catch (e) {
  198 |     await screenshotOnFail(page, "CP-08");
  199 |     throw e;
  200 |   }
  201 | });
  202 | 
  203 | // ===========================================================================
  204 | // CP-09 — Navegación entre meses
  205 | // ===========================================================================
  206 | test("CP-09 — Navegación de meses cambia el título correctamente", async ({ page }) => {
  207 |   try {
  208 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  209 |     await expect(page).toHaveURL("/");
  210 | 
  211 |     // Título inicial: Mayo 2026
  212 |     await expect(page.getByRole("heading", { name: /Mayo 2026/ })).toBeVisible();
  213 | 
  214 |     // Pulsar ‹ → Abril 2026
  215 |     await page.getByRole("button", { name: "‹" }).click();
  216 |     await expect(page.getByRole("heading", { name: /Abril 2026/ })).toBeVisible();
  217 | 
  218 |     // Pulsar › → volver a Mayo 2026
  219 |     await page.getByRole("button", { name: "›" }).click();
  220 |     await expect(page.getByRole("heading", { name: /Mayo 2026/ })).toBeVisible();
  221 |   } catch (e) {
  222 |     await screenshotOnFail(page, "CP-09");
  223 |     throw e;
  224 |   }
  225 | });
  226 | 
  227 | // ===========================================================================
  228 | // CP-10 — Cierre de sesión
  229 | // ===========================================================================
  230 | test("CP-10 — Cierre de sesión redirige a /login", async ({ page }) => {
  231 |   try {
  232 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  233 |     await expect(page).toHaveURL("/");
  234 | 
  235 |     await page.getByRole("button", { name: "Cerrar sesión" }).click();
  236 |     await expect(page).toHaveURL(/\/login/);
  237 |   } catch (e) {
  238 |     await screenshotOnFail(page, "CP-10");
  239 |     throw e;
  240 |   }
  241 | });
  242 | 
  243 | // ===========================================================================
  244 | // CP-11 — Acceso directo a ruta protegida post-logout
  245 | // ===========================================================================
  246 | test("CP-11 — Acceso a / tras logout redirige a /login", async ({ page }) => {
  247 |   try {
  248 |     // Hacer login y logout primero
  249 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  250 |     await expect(page).toHaveURL("/");
  251 |     await page.getByRole("button", { name: "Cerrar sesión" }).click();
  252 |     await expect(page).toHaveURL(/\/login/);
  253 | 
  254 |     // Intentar acceder directamente a /
  255 |     await page.goto("/");
  256 |     await expect(page).toHaveURL(/\/login/);
  257 |   } catch (e) {
  258 |     await screenshotOnFail(page, "CP-11");
  259 |     throw e;
  260 |   }
  261 | });
  262 | 
```