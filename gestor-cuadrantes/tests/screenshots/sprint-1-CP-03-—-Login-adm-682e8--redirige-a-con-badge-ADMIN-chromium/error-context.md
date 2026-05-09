# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint-1.spec.ts >> CP-03 — Login admin correcto redirige a / con badge ADMIN
- Location: tests/e2e/sprint-1.spec.ts:80:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('ADMIN')
Expected: visible
Error: strict mode violation: getByText('ADMIN') resolved to 2 elements:
    1) <span class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">ADMIN</span> aka getByText('ADMIN', { exact: true })
    2) <td class="sticky left-0 z-10 bg-white px-3 py-1 font-medium text-gray-700 border-r border-b border-gray-200 whitespace-nowrap">Administrador</td> aka getByRole('cell', { name: 'Administrador' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('ADMIN')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - banner [ref=e13]:
      - heading "Gestor de Cuadrantes" [level=1] [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]: admin@cuadrantes.localADMIN
        - button "Cerrar sesión" [ref=e17]
    - main [ref=e18]:
      - generic [ref=e19]:
        - button "‹" [ref=e20]
        - heading "Mayo 2026" [level=2] [ref=e21]
        - button "›" [ref=e22]
        - generic [ref=e23]: Vista de ejemplo — Mayo 2026
      - table [ref=e25]:
        - rowgroup [ref=e26]:
          - row "Empleado 1 V 2 S 3 D 4 L 5 M 6 X 7 J 8 V 9 S 10 D 11 L 12 M 13 X 14 J 15 V 16 S 17 D 18 L 19 M 20 X 21 J 22 V 23 S 24 D 25 L 26 M 27 X 28 J 29 V 30 S 31 D Contadores" [ref=e27]:
            - columnheader "Empleado" [ref=e28]
            - columnheader "1 V" [ref=e29]:
              - generic [ref=e30]: "1"
              - generic [ref=e31]: V
            - columnheader "2 S" [ref=e32]:
              - generic [ref=e33]: "2"
              - generic [ref=e34]: S
            - columnheader "3 D" [ref=e35]:
              - generic [ref=e36]: "3"
              - generic [ref=e37]: D
            - columnheader "4 L" [ref=e38]:
              - generic [ref=e39]: "4"
              - generic [ref=e40]: L
            - columnheader "5 M" [ref=e41]:
              - generic [ref=e42]: "5"
              - generic [ref=e43]: M
            - columnheader "6 X" [ref=e44]:
              - generic [ref=e45]: "6"
              - generic [ref=e46]: X
            - columnheader "7 J" [ref=e47]:
              - generic [ref=e48]: "7"
              - generic [ref=e49]: J
            - columnheader "8 V" [ref=e50]:
              - generic [ref=e51]: "8"
              - generic [ref=e52]: V
            - columnheader "9 S" [ref=e53]:
              - generic [ref=e54]: "9"
              - generic [ref=e55]: S
            - columnheader "10 D" [ref=e56]:
              - generic [ref=e57]: "10"
              - generic [ref=e58]: D
            - columnheader "11 L" [ref=e59]:
              - generic [ref=e60]: "11"
              - generic [ref=e61]: L
            - columnheader "12 M" [ref=e62]:
              - generic [ref=e63]: "12"
              - generic [ref=e64]: M
            - columnheader "13 X" [ref=e65]:
              - generic [ref=e66]: "13"
              - generic [ref=e67]: X
            - columnheader "14 J" [ref=e68]:
              - generic [ref=e69]: "14"
              - generic [ref=e70]: J
            - columnheader "15 V" [ref=e71]:
              - generic [ref=e72]: "15"
              - generic [ref=e73]: V
            - columnheader "16 S" [ref=e74]:
              - generic [ref=e75]: "16"
              - generic [ref=e76]: S
            - columnheader "17 D" [ref=e77]:
              - generic [ref=e78]: "17"
              - generic [ref=e79]: D
            - columnheader "18 L" [ref=e80]:
              - generic [ref=e81]: "18"
              - generic [ref=e82]: L
            - columnheader "19 M" [ref=e83]:
              - generic [ref=e84]: "19"
              - generic [ref=e85]: M
            - columnheader "20 X" [ref=e86]:
              - generic [ref=e87]: "20"
              - generic [ref=e88]: X
            - columnheader "21 J" [ref=e89]:
              - generic [ref=e90]: "21"
              - generic [ref=e91]: J
            - columnheader "22 V" [ref=e92]:
              - generic [ref=e93]: "22"
              - generic [ref=e94]: V
            - columnheader "23 S" [ref=e95]:
              - generic [ref=e96]: "23"
              - generic [ref=e97]: S
            - columnheader "24 D" [ref=e98]:
              - generic [ref=e99]: "24"
              - generic [ref=e100]: D
            - columnheader "25 L" [ref=e101]:
              - generic [ref=e102]: "25"
              - generic [ref=e103]: L
            - columnheader "26 M" [ref=e104]:
              - generic [ref=e105]: "26"
              - generic [ref=e106]: M
            - columnheader "27 X" [ref=e107]:
              - generic [ref=e108]: "27"
              - generic [ref=e109]: X
            - columnheader "28 J" [ref=e110]:
              - generic [ref=e111]: "28"
              - generic [ref=e112]: J
            - columnheader "29 V" [ref=e113]:
              - generic [ref=e114]: "29"
              - generic [ref=e115]: V
            - columnheader "30 S" [ref=e116]:
              - generic [ref=e117]: "30"
              - generic [ref=e118]: S
            - columnheader "31 D" [ref=e119]:
              - generic [ref=e120]: "31"
              - generic [ref=e121]: D
            - columnheader "Contadores" [ref=e122]
        - rowgroup [ref=e123]:
          - row "Administrador J J J J J D D J J J J J D D J J J J J D D J J J J J D D J J J J:23 D:8" [ref=e124]:
            - cell "Administrador" [ref=e125]
            - cell "J" [ref=e126]:
              - generic "Jornada normal" [ref=e127]: J
            - cell "J" [ref=e128]:
              - generic "Jornada normal" [ref=e129]: J
            - cell "J" [ref=e130]:
              - generic "Jornada normal" [ref=e131]: J
            - cell "J" [ref=e132]:
              - generic "Jornada normal" [ref=e133]: J
            - cell "J" [ref=e134]:
              - generic "Jornada normal" [ref=e135]: J
            - cell "D" [ref=e136]:
              - generic "Descanso" [ref=e137]: D
            - cell "D" [ref=e138]:
              - generic "Descanso" [ref=e139]: D
            - cell "J" [ref=e140]:
              - generic "Jornada normal" [ref=e141]: J
            - cell "J" [ref=e142]:
              - generic "Jornada normal" [ref=e143]: J
            - cell "J" [ref=e144]:
              - generic "Jornada normal" [ref=e145]: J
            - cell "J" [ref=e146]:
              - generic "Jornada normal" [ref=e147]: J
            - cell "J" [ref=e148]:
              - generic "Jornada normal" [ref=e149]: J
            - cell "D" [ref=e150]:
              - generic "Descanso" [ref=e151]: D
            - cell "D" [ref=e152]:
              - generic "Descanso" [ref=e153]: D
            - cell "J" [ref=e154]:
              - generic "Jornada normal" [ref=e155]: J
            - cell "J" [ref=e156]:
              - generic "Jornada normal" [ref=e157]: J
            - cell "J" [ref=e158]:
              - generic "Jornada normal" [ref=e159]: J
            - cell "J" [ref=e160]:
              - generic "Jornada normal" [ref=e161]: J
            - cell "J" [ref=e162]:
              - generic "Jornada normal" [ref=e163]: J
            - cell "D" [ref=e164]:
              - generic "Descanso" [ref=e165]: D
            - cell "D" [ref=e166]:
              - generic "Descanso" [ref=e167]: D
            - cell "J" [ref=e168]:
              - generic "Jornada normal" [ref=e169]: J
            - cell "J" [ref=e170]:
              - generic "Jornada normal" [ref=e171]: J
            - cell "J" [ref=e172]:
              - generic "Jornada normal" [ref=e173]: J
            - cell "J" [ref=e174]:
              - generic "Jornada normal" [ref=e175]: J
            - cell "J" [ref=e176]:
              - generic "Jornada normal" [ref=e177]: J
            - cell "D" [ref=e178]:
              - generic "Descanso" [ref=e179]: D
            - cell "D" [ref=e180]:
              - generic "Descanso" [ref=e181]: D
            - cell "J" [ref=e182]:
              - generic "Jornada normal" [ref=e183]: J
            - cell "J" [ref=e184]:
              - generic "Jornada normal" [ref=e185]: J
            - cell "J" [ref=e186]:
              - generic "Jornada normal" [ref=e187]: J
            - cell "J:23 D:8" [ref=e188]:
              - generic [ref=e189]:
                - generic [ref=e190]: J:23
                - generic [ref=e191]: D:8
          - row "Técnico 1 D D N N N N N N N D D D M M M M M D D M M M M M D D M M M M M M:15 N:7 D:9" [ref=e192]:
            - cell "Técnico 1" [ref=e193]
            - cell "D" [ref=e194]:
              - generic "Descanso" [ref=e195]: D
            - cell "D" [ref=e196]:
              - generic "Descanso" [ref=e197]: D
            - cell "N" [ref=e198]:
              - generic "Noche" [ref=e199]: "N"
            - cell "N" [ref=e200]:
              - generic "Noche" [ref=e201]: "N"
            - cell "N" [ref=e202]:
              - generic "Noche" [ref=e203]: "N"
            - cell "N" [ref=e204]:
              - generic "Noche" [ref=e205]: "N"
            - cell "N" [ref=e206]:
              - generic "Noche" [ref=e207]: "N"
            - cell "N" [ref=e208]:
              - generic "Noche" [ref=e209]: "N"
            - cell "N" [ref=e210]:
              - generic "Noche" [ref=e211]: "N"
            - cell "D" [ref=e212]:
              - generic "Descanso" [ref=e213]: D
            - cell "D" [ref=e214]:
              - generic "Descanso" [ref=e215]: D
            - cell "D" [ref=e216]:
              - generic "Descanso" [ref=e217]: D
            - cell "M" [ref=e218]:
              - generic "Mañana" [ref=e219]: M
            - cell "M" [ref=e220]:
              - generic "Mañana" [ref=e221]: M
            - cell "M" [ref=e222]:
              - generic "Mañana" [ref=e223]: M
            - cell "M" [ref=e224]:
              - generic "Mañana" [ref=e225]: M
            - cell "M" [ref=e226]:
              - generic "Mañana" [ref=e227]: M
            - cell "D" [ref=e228]:
              - generic "Descanso" [ref=e229]: D
            - cell "D" [ref=e230]:
              - generic "Descanso" [ref=e231]: D
            - cell "M" [ref=e232]:
              - generic "Mañana" [ref=e233]: M
            - cell "M" [ref=e234]:
              - generic "Mañana" [ref=e235]: M
            - cell "M" [ref=e236]:
              - generic "Mañana" [ref=e237]: M
            - cell "M" [ref=e238]:
              - generic "Mañana" [ref=e239]: M
            - cell "M" [ref=e240]:
              - generic "Mañana" [ref=e241]: M
            - cell "D" [ref=e242]:
              - generic "Descanso" [ref=e243]: D
            - cell "D" [ref=e244]:
              - generic "Descanso" [ref=e245]: D
            - cell "M" [ref=e246]:
              - generic "Mañana" [ref=e247]: M
            - cell "M" [ref=e248]:
              - generic "Mañana" [ref=e249]: M
            - cell "M" [ref=e250]:
              - generic "Mañana" [ref=e251]: M
            - cell "M" [ref=e252]:
              - generic "Mañana" [ref=e253]: M
            - cell "M" [ref=e254]:
              - generic "Mañana" [ref=e255]: M
            - cell "M:15 N:7 D:9" [ref=e256]:
              - generic [ref=e257]:
                - generic [ref=e258]: M:15
                - generic [ref=e259]: N:7
                - generic [ref=e260]: D:9
          - row "Técnico 2 M M M M M D D M M M M M D D T T T T T D D T T T T T D D T T T M:10 T:13 D:8" [ref=e261]:
            - cell "Técnico 2" [ref=e262]
            - cell "M" [ref=e263]:
              - generic "Mañana" [ref=e264]: M
            - cell "M" [ref=e265]:
              - generic "Mañana" [ref=e266]: M
            - cell "M" [ref=e267]:
              - generic "Mañana" [ref=e268]: M
            - cell "M" [ref=e269]:
              - generic "Mañana" [ref=e270]: M
            - cell "M" [ref=e271]:
              - generic "Mañana" [ref=e272]: M
            - cell "D" [ref=e273]:
              - generic "Descanso" [ref=e274]: D
            - cell "D" [ref=e275]:
              - generic "Descanso" [ref=e276]: D
            - cell "M" [ref=e277]:
              - generic "Mañana" [ref=e278]: M
            - cell "M" [ref=e279]:
              - generic "Mañana" [ref=e280]: M
            - cell "M" [ref=e281]:
              - generic "Mañana" [ref=e282]: M
            - cell "M" [ref=e283]:
              - generic "Mañana" [ref=e284]: M
            - cell "M" [ref=e285]:
              - generic "Mañana" [ref=e286]: M
            - cell "D" [ref=e287]:
              - generic "Descanso" [ref=e288]: D
            - cell "D" [ref=e289]:
              - generic "Descanso" [ref=e290]: D
            - cell "T" [ref=e291]:
              - generic "Tarde" [ref=e292]: T
            - cell "T" [ref=e293]:
              - generic "Tarde" [ref=e294]: T
            - cell "T" [ref=e295]:
              - generic "Tarde" [ref=e296]: T
            - cell "T" [ref=e297]:
              - generic "Tarde" [ref=e298]: T
            - cell "T" [ref=e299]:
              - generic "Tarde" [ref=e300]: T
            - cell "D" [ref=e301]:
              - generic "Descanso" [ref=e302]: D
            - cell "D" [ref=e303]:
              - generic "Descanso" [ref=e304]: D
            - cell "T" [ref=e305]:
              - generic "Tarde" [ref=e306]: T
            - cell "T" [ref=e307]:
              - generic "Tarde" [ref=e308]: T
            - cell "T" [ref=e309]:
              - generic "Tarde" [ref=e310]: T
            - cell "T" [ref=e311]:
              - generic "Tarde" [ref=e312]: T
            - cell "T" [ref=e313]:
              - generic "Tarde" [ref=e314]: T
            - cell "D" [ref=e315]:
              - generic "Descanso" [ref=e316]: D
            - cell "D" [ref=e317]:
              - generic "Descanso" [ref=e318]: D
            - cell "T" [ref=e319]:
              - generic "Tarde" [ref=e320]: T
            - cell "T" [ref=e321]:
              - generic "Tarde" [ref=e322]: T
            - cell "T" [ref=e323]:
              - generic "Tarde" [ref=e324]: T
            - cell "M:10 T:13 D:8" [ref=e325]:
              - generic [ref=e326]:
                - generic [ref=e327]: M:10
                - generic [ref=e328]: T:13
                - generic [ref=e329]: D:8
          - row "Técnico 3 T T T T T D D T T T T T D D M M M M M D D M M M M M D D M M M M:13 T:10 D:8" [ref=e330]:
            - cell "Técnico 3" [ref=e331]
            - cell "T" [ref=e332]:
              - generic "Tarde" [ref=e333]: T
            - cell "T" [ref=e334]:
              - generic "Tarde" [ref=e335]: T
            - cell "T" [ref=e336]:
              - generic "Tarde" [ref=e337]: T
            - cell "T" [ref=e338]:
              - generic "Tarde" [ref=e339]: T
            - cell "T" [ref=e340]:
              - generic "Tarde" [ref=e341]: T
            - cell "D" [ref=e342]:
              - generic "Descanso" [ref=e343]: D
            - cell "D" [ref=e344]:
              - generic "Descanso" [ref=e345]: D
            - cell "T" [ref=e346]:
              - generic "Tarde" [ref=e347]: T
            - cell "T" [ref=e348]:
              - generic "Tarde" [ref=e349]: T
            - cell "T" [ref=e350]:
              - generic "Tarde" [ref=e351]: T
            - cell "T" [ref=e352]:
              - generic "Tarde" [ref=e353]: T
            - cell "T" [ref=e354]:
              - generic "Tarde" [ref=e355]: T
            - cell "D" [ref=e356]:
              - generic "Descanso" [ref=e357]: D
            - cell "D" [ref=e358]:
              - generic "Descanso" [ref=e359]: D
            - cell "M" [ref=e360]:
              - generic "Mañana" [ref=e361]: M
            - cell "M" [ref=e362]:
              - generic "Mañana" [ref=e363]: M
            - cell "M" [ref=e364]:
              - generic "Mañana" [ref=e365]: M
            - cell "M" [ref=e366]:
              - generic "Mañana" [ref=e367]: M
            - cell "M" [ref=e368]:
              - generic "Mañana" [ref=e369]: M
            - cell "D" [ref=e370]:
              - generic "Descanso" [ref=e371]: D
            - cell "D" [ref=e372]:
              - generic "Descanso" [ref=e373]: D
            - cell "M" [ref=e374]:
              - generic "Mañana" [ref=e375]: M
            - cell "M" [ref=e376]:
              - generic "Mañana" [ref=e377]: M
            - cell "M" [ref=e378]:
              - generic "Mañana" [ref=e379]: M
            - cell "M" [ref=e380]:
              - generic "Mañana" [ref=e381]: M
            - cell "M" [ref=e382]:
              - generic "Mañana" [ref=e383]: M
            - cell "D" [ref=e384]:
              - generic "Descanso" [ref=e385]: D
            - cell "D" [ref=e386]:
              - generic "Descanso" [ref=e387]: D
            - cell "M" [ref=e388]:
              - generic "Mañana" [ref=e389]: M
            - cell "M" [ref=e390]:
              - generic "Mañana" [ref=e391]: M
            - cell "M" [ref=e392]:
              - generic "Mañana" [ref=e393]: M
            - cell "M:13 T:10 D:8" [ref=e394]:
              - generic [ref=e395]:
                - generic [ref=e396]: M:13
                - generic [ref=e397]: T:10
                - generic [ref=e398]: D:8
          - row "Técnico 4 M M M M M D D D D N N N N N N N D D D M M M M M D D M M M M M M:15 N:7 D:9" [ref=e399]:
            - cell "Técnico 4" [ref=e400]
            - cell "M" [ref=e401]:
              - generic "Mañana" [ref=e402]: M
            - cell "M" [ref=e403]:
              - generic "Mañana" [ref=e404]: M
            - cell "M" [ref=e405]:
              - generic "Mañana" [ref=e406]: M
            - cell "M" [ref=e407]:
              - generic "Mañana" [ref=e408]: M
            - cell "M" [ref=e409]:
              - generic "Mañana" [ref=e410]: M
            - cell "D" [ref=e411]:
              - generic "Descanso" [ref=e412]: D
            - cell "D" [ref=e413]:
              - generic "Descanso" [ref=e414]: D
            - cell "D" [ref=e415]:
              - generic "Descanso" [ref=e416]: D
            - cell "D" [ref=e417]:
              - generic "Descanso" [ref=e418]: D
            - cell "N" [ref=e419]:
              - generic "Noche" [ref=e420]: "N"
            - cell "N" [ref=e421]:
              - generic "Noche" [ref=e422]: "N"
            - cell "N" [ref=e423]:
              - generic "Noche" [ref=e424]: "N"
            - cell "N" [ref=e425]:
              - generic "Noche" [ref=e426]: "N"
            - cell "N" [ref=e427]:
              - generic "Noche" [ref=e428]: "N"
            - cell "N" [ref=e429]:
              - generic "Noche" [ref=e430]: "N"
            - cell "N" [ref=e431]:
              - generic "Noche" [ref=e432]: "N"
            - cell "D" [ref=e433]:
              - generic "Descanso" [ref=e434]: D
            - cell "D" [ref=e435]:
              - generic "Descanso" [ref=e436]: D
            - cell "D" [ref=e437]:
              - generic "Descanso" [ref=e438]: D
            - cell "M" [ref=e439]:
              - generic "Mañana" [ref=e440]: M
            - cell "M" [ref=e441]:
              - generic "Mañana" [ref=e442]: M
            - cell "M" [ref=e443]:
              - generic "Mañana" [ref=e444]: M
            - cell "M" [ref=e445]:
              - generic "Mañana" [ref=e446]: M
            - cell "M" [ref=e447]:
              - generic "Mañana" [ref=e448]: M
            - cell "D" [ref=e449]:
              - generic "Descanso" [ref=e450]: D
            - cell "D" [ref=e451]:
              - generic "Descanso" [ref=e452]: D
            - cell "M" [ref=e453]:
              - generic "Mañana" [ref=e454]: M
            - cell "M" [ref=e455]:
              - generic "Mañana" [ref=e456]: M
            - cell "M" [ref=e457]:
              - generic "Mañana" [ref=e458]: M
            - cell "M" [ref=e459]:
              - generic "Mañana" [ref=e460]: M
            - cell "M" [ref=e461]:
              - generic "Mañana" [ref=e462]: M
            - cell "M:15 N:7 D:9" [ref=e463]:
              - generic [ref=e464]:
                - generic [ref=e465]: M:15
                - generic [ref=e466]: N:7
                - generic [ref=e467]: D:9
          - row "Técnico 5 V V V V V V V M M M M M D D M M M M M D D T T T T T D D T T T M:10 T:8 D:6 V:7" [ref=e468]:
            - cell "Técnico 5" [ref=e469]
            - cell "V" [ref=e470]:
              - generic "Vacaciones" [ref=e471]: V
            - cell "V" [ref=e472]:
              - generic "Vacaciones" [ref=e473]: V
            - cell "V" [ref=e474]:
              - generic "Vacaciones" [ref=e475]: V
            - cell "V" [ref=e476]:
              - generic "Vacaciones" [ref=e477]: V
            - cell "V" [ref=e478]:
              - generic "Vacaciones" [ref=e479]: V
            - cell "V" [ref=e480]:
              - generic "Vacaciones" [ref=e481]: V
            - cell "V" [ref=e482]:
              - generic "Vacaciones" [ref=e483]: V
            - cell "M" [ref=e484]:
              - generic "Mañana" [ref=e485]: M
            - cell "M" [ref=e486]:
              - generic "Mañana" [ref=e487]: M
            - cell "M" [ref=e488]:
              - generic "Mañana" [ref=e489]: M
            - cell "M" [ref=e490]:
              - generic "Mañana" [ref=e491]: M
            - cell "M" [ref=e492]:
              - generic "Mañana" [ref=e493]: M
            - cell "D" [ref=e494]:
              - generic "Descanso" [ref=e495]: D
            - cell "D" [ref=e496]:
              - generic "Descanso" [ref=e497]: D
            - cell "M" [ref=e498]:
              - generic "Mañana" [ref=e499]: M
            - cell "M" [ref=e500]:
              - generic "Mañana" [ref=e501]: M
            - cell "M" [ref=e502]:
              - generic "Mañana" [ref=e503]: M
            - cell "M" [ref=e504]:
              - generic "Mañana" [ref=e505]: M
            - cell "M" [ref=e506]:
              - generic "Mañana" [ref=e507]: M
            - cell "D" [ref=e508]:
              - generic "Descanso" [ref=e509]: D
            - cell "D" [ref=e510]:
              - generic "Descanso" [ref=e511]: D
            - cell "T" [ref=e512]:
              - generic "Tarde" [ref=e513]: T
            - cell "T" [ref=e514]:
              - generic "Tarde" [ref=e515]: T
            - cell "T" [ref=e516]:
              - generic "Tarde" [ref=e517]: T
            - cell "T" [ref=e518]:
              - generic "Tarde" [ref=e519]: T
            - cell "T" [ref=e520]:
              - generic "Tarde" [ref=e521]: T
            - cell "D" [ref=e522]:
              - generic "Descanso" [ref=e523]: D
            - cell "D" [ref=e524]:
              - generic "Descanso" [ref=e525]: D
            - cell "T" [ref=e526]:
              - generic "Tarde" [ref=e527]: T
            - cell "T" [ref=e528]:
              - generic "Tarde" [ref=e529]: T
            - cell "T" [ref=e530]:
              - generic "Tarde" [ref=e531]: T
            - cell "M:10 T:8 D:6 V:7" [ref=e532]:
              - generic [ref=e533]:
                - generic [ref=e534]: M:10
                - generic [ref=e535]: T:8
                - generic [ref=e536]: D:6
                - generic [ref=e537]: V:7
          - row "Técnico 6 T T T T T D D T T T T T D D T T T T T D D T T T T T D D T T T T:23 D:8" [ref=e538]:
            - cell "Técnico 6" [ref=e539]
            - cell "T" [ref=e540]:
              - generic "Tarde" [ref=e541]: T
            - cell "T" [ref=e542]:
              - generic "Tarde" [ref=e543]: T
            - cell "T" [ref=e544]:
              - generic "Tarde" [ref=e545]: T
            - cell "T" [ref=e546]:
              - generic "Tarde" [ref=e547]: T
            - cell "T" [ref=e548]:
              - generic "Tarde" [ref=e549]: T
            - cell "D" [ref=e550]:
              - generic "Descanso" [ref=e551]: D
            - cell "D" [ref=e552]:
              - generic "Descanso" [ref=e553]: D
            - cell "T" [ref=e554]:
              - generic "Tarde" [ref=e555]: T
            - cell "T" [ref=e556]:
              - generic "Tarde" [ref=e557]: T
            - cell "T" [ref=e558]:
              - generic "Tarde" [ref=e559]: T
            - cell "T" [ref=e560]:
              - generic "Tarde" [ref=e561]: T
            - cell "T" [ref=e562]:
              - generic "Tarde" [ref=e563]: T
            - cell "D" [ref=e564]:
              - generic "Descanso" [ref=e565]: D
            - cell "D" [ref=e566]:
              - generic "Descanso" [ref=e567]: D
            - cell "T" [ref=e568]:
              - generic "Tarde" [ref=e569]: T
            - cell "T" [ref=e570]:
              - generic "Tarde" [ref=e571]: T
            - cell "T" [ref=e572]:
              - generic "Tarde" [ref=e573]: T
            - cell "T" [ref=e574]:
              - generic "Tarde" [ref=e575]: T
            - cell "T" [ref=e576]:
              - generic "Tarde" [ref=e577]: T
            - cell "D" [ref=e578]:
              - generic "Descanso" [ref=e579]: D
            - cell "D" [ref=e580]:
              - generic "Descanso" [ref=e581]: D
            - cell "T" [ref=e582]:
              - generic "Tarde" [ref=e583]: T
            - cell "T" [ref=e584]:
              - generic "Tarde" [ref=e585]: T
            - cell "T" [ref=e586]:
              - generic "Tarde" [ref=e587]: T
            - cell "T" [ref=e588]:
              - generic "Tarde" [ref=e589]: T
            - cell "T" [ref=e590]:
              - generic "Tarde" [ref=e591]: T
            - cell "D" [ref=e592]:
              - generic "Descanso" [ref=e593]: D
            - cell "D" [ref=e594]:
              - generic "Descanso" [ref=e595]: D
            - cell "T" [ref=e596]:
              - generic "Tarde" [ref=e597]: T
            - cell "T" [ref=e598]:
              - generic "Tarde" [ref=e599]: T
            - cell "T" [ref=e600]:
              - generic "Tarde" [ref=e601]: T
            - cell "T:23 D:8" [ref=e602]:
              - generic [ref=e603]:
                - generic [ref=e604]: T:23
                - generic [ref=e605]: D:8
          - row "Técnico 7 B B B B B B B B M M M M D D M M M M M D D M M M M M D D M M M M:17 D:6 B:8" [ref=e606]:
            - cell "Técnico 7" [ref=e607]
            - cell "B" [ref=e608]:
              - generic "Baja" [ref=e609]: B
            - cell "B" [ref=e610]:
              - generic "Baja" [ref=e611]: B
            - cell "B" [ref=e612]:
              - generic "Baja" [ref=e613]: B
            - cell "B" [ref=e614]:
              - generic "Baja" [ref=e615]: B
            - cell "B" [ref=e616]:
              - generic "Baja" [ref=e617]: B
            - cell "B" [ref=e618]:
              - generic "Baja" [ref=e619]: B
            - cell "B" [ref=e620]:
              - generic "Baja" [ref=e621]: B
            - cell "B" [ref=e622]:
              - generic "Baja" [ref=e623]: B
            - cell "M" [ref=e624]:
              - generic "Mañana" [ref=e625]: M
            - cell "M" [ref=e626]:
              - generic "Mañana" [ref=e627]: M
            - cell "M" [ref=e628]:
              - generic "Mañana" [ref=e629]: M
            - cell "M" [ref=e630]:
              - generic "Mañana" [ref=e631]: M
            - cell "D" [ref=e632]:
              - generic "Descanso" [ref=e633]: D
            - cell "D" [ref=e634]:
              - generic "Descanso" [ref=e635]: D
            - cell "M" [ref=e636]:
              - generic "Mañana" [ref=e637]: M
            - cell "M" [ref=e638]:
              - generic "Mañana" [ref=e639]: M
            - cell "M" [ref=e640]:
              - generic "Mañana" [ref=e641]: M
            - cell "M" [ref=e642]:
              - generic "Mañana" [ref=e643]: M
            - cell "M" [ref=e644]:
              - generic "Mañana" [ref=e645]: M
            - cell "D" [ref=e646]:
              - generic "Descanso" [ref=e647]: D
            - cell "D" [ref=e648]:
              - generic "Descanso" [ref=e649]: D
            - cell "M" [ref=e650]:
              - generic "Mañana" [ref=e651]: M
            - cell "M" [ref=e652]:
              - generic "Mañana" [ref=e653]: M
            - cell "M" [ref=e654]:
              - generic "Mañana" [ref=e655]: M
            - cell "M" [ref=e656]:
              - generic "Mañana" [ref=e657]: M
            - cell "M" [ref=e658]:
              - generic "Mañana" [ref=e659]: M
            - cell "D" [ref=e660]:
              - generic "Descanso" [ref=e661]: D
            - cell "D" [ref=e662]:
              - generic "Descanso" [ref=e663]: D
            - cell "M" [ref=e664]:
              - generic "Mañana" [ref=e665]: M
            - cell "M" [ref=e666]:
              - generic "Mañana" [ref=e667]: M
            - cell "M" [ref=e668]:
              - generic "Mañana" [ref=e669]: M
            - cell "M:17 D:6 B:8" [ref=e670]:
              - generic [ref=e671]:
                - generic [ref=e672]: M:17
                - generic [ref=e673]: D:6
                - generic [ref=e674]: B:8
      - generic [ref=e675]:
        - generic [ref=e676]:
          - generic [ref=e677]: M
          - generic [ref=e678]: Mañana
        - generic [ref=e679]:
          - generic [ref=e680]: T
          - generic [ref=e681]: Tarde
        - generic [ref=e682]:
          - generic [ref=e683]: "N"
          - generic [ref=e684]: Noche
        - generic [ref=e685]:
          - generic [ref=e686]: J
          - generic [ref=e687]: Jornada normal
        - generic [ref=e688]:
          - generic [ref=e689]: D
          - generic [ref=e690]: Descanso
        - generic [ref=e691]:
          - generic [ref=e692]: V
          - generic [ref=e693]: Vacaciones
        - generic [ref=e694]:
          - generic [ref=e695]: B
          - generic [ref=e696]: Baja
```

# Test source

```ts
  1   | import { test, expect, Page } from "@playwright/test";
  2   | import * as path from "path";
  3   | 
  4   | // ---------------------------------------------------------------------------
  5   | // Credenciales leídas de .env.test — nunca hardcodeadas
  6   | // ---------------------------------------------------------------------------
  7   | const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
  8   | const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
  9   | const TECH_EMAIL = process.env.TECH_EMAIL ?? "";
  10  | const TECH_PASSWORD = process.env.TECH_PASSWORD ?? "";
  11  | 
  12  | // Colores de turno exactos definidos en lib/constants/shift-colors.ts
  13  | const SHIFT_COLORS = {
  14  |   M: "rgb(255, 152, 0)",   // #FF9800 — Mañana (naranja)
  15  |   T: "rgb(33, 150, 243)",  // #2196F3 — Tarde (azul)
  16  |   N: "rgb(76, 175, 80)",   // #4CAF50 — Noche (verde)
  17  |   J: "rgb(255, 193, 7)",   // #FFC107 — Jornada normal (amarillo)
  18  |   D: "rgb(245, 245, 245)", // #F5F5F5 — Descanso (gris claro)
  19  |   V: "rgb(33, 33, 33)",    // #212121 — Vacaciones (negro)
  20  |   B: "rgb(55, 71, 79)",    // #37474F — Baja (negro oscuro)
  21  | };
  22  | 
  23  | // ---------------------------------------------------------------------------
  24  | // Helper: hace login y espera redirección a /
  25  | // ---------------------------------------------------------------------------
  26  | async function login(page: Page, email: string, password: string) {
  27  |   await page.goto("/login");
  28  |   await page.getByLabel("Email").fill(email);
  29  |   await page.getByLabel("Contraseña").fill(password);
  30  |   await page.getByRole("button", { name: "Entrar" }).click();
  31  | }
  32  | 
  33  | // ---------------------------------------------------------------------------
  34  | // Helper: captura screenshot en caso de fallo
  35  | // ---------------------------------------------------------------------------
  36  | async function screenshotOnFail(page: Page, cpId: string) {
  37  |   const screenshotsDir = path.resolve("tests/screenshots");
  38  |   await page.screenshot({
  39  |     path: path.join(screenshotsDir, `${cpId}-fail.png`),
  40  |     fullPage: true,
  41  |   });
  42  | }
  43  | 
  44  | // ===========================================================================
  45  | // CP-01 — Acceso sin sesión
  46  | // ===========================================================================
  47  | test("CP-01 — Acceso sin sesión redirige a /login", async ({ page }) => {
  48  |   try {
  49  |     await page.goto("/");
  50  |     await expect(page).toHaveURL(/\/login/);
  51  |     await expect(page.getByRole("heading", { name: "Gestor de Cuadrantes" })).toBeVisible();
  52  |   } catch (e) {
  53  |     await screenshotOnFail(page, "CP-01");
  54  |     throw e;
  55  |   }
  56  | });
  57  | 
  58  | // ===========================================================================
  59  | // CP-02 — Login con credenciales incorrectas
  60  | // ===========================================================================
  61  | test("CP-02 — Login con credenciales incorrectas muestra error", async ({ page }) => {
  62  |   try {
  63  |     await page.goto("/login");
  64  |     await page.getByLabel("Email").fill("noexiste@test.com");
  65  |     await page.getByLabel("Contraseña").fill("ContraseñaMal123!");
  66  |     await page.getByRole("button", { name: "Entrar" }).click();
  67  | 
  68  |     const errorMsg = page.getByText("Email o contraseña incorrectos");
  69  |     await expect(errorMsg).toBeVisible();
  70  |     await expect(page).toHaveURL(/\/login/);
  71  |   } catch (e) {
  72  |     await screenshotOnFail(page, "CP-02");
  73  |     throw e;
  74  |   }
  75  | });
  76  | 
  77  | // ===========================================================================
  78  | // CP-03 — Login admin correcto
  79  | // ===========================================================================
  80  | test("CP-03 — Login admin correcto redirige a / con badge ADMIN", async ({ page }) => {
  81  |   try {
  82  |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  83  | 
  84  |     await expect(page).toHaveURL("/");
  85  |     await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
> 86  |     await expect(page.getByText("ADMIN")).toBeVisible();
      |                                           ^ Error: expect(locator).toBeVisible() failed
  87  |   } catch (e) {
  88  |     await screenshotOnFail(page, "CP-03");
  89  |     throw e;
  90  |   }
  91  | });
  92  | 
  93  | // ===========================================================================
  94  | // CP-04 — Login técnico correcto
  95  | // ===========================================================================
  96  | test("CP-04 — Login técnico correcto muestra badge EMPLOYEE", async ({ page }) => {
  97  |   try {
  98  |     await login(page, TECH_EMAIL, TECH_PASSWORD);
  99  | 
  100 |     await expect(page).toHaveURL("/");
  101 |     await expect(page.getByText("EMPLOYEE")).toBeVisible();
  102 |   } catch (e) {
  103 |     await screenshotOnFail(page, "CP-04");
  104 |     throw e;
  105 |   }
  106 | });
  107 | 
  108 | // ===========================================================================
  109 | // CP-05 — Vista del cuadrante: grid con 8 filas y 31 columnas
  110 | // ===========================================================================
  111 | test("CP-05 — Vista del cuadrante muestra grid de 8 empleados y 31 días", async ({ page }) => {
  112 |   try {
  113 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  114 |     await expect(page).toHaveURL("/");
  115 | 
  116 |     const table = page.locator("table");
  117 |     await expect(table).toBeVisible();
  118 | 
  119 |     // 8 filas de datos (tbody tr)
  120 |     const rows = page.locator("tbody tr");
  121 |     await expect(rows).toHaveCount(8);
  122 | 
  123 |     // 31 celdas de día en la primera fila + columna nombre + columna contadores = 33 th en el header
  124 |     const headerCells = page.locator("thead tr th");
  125 |     await expect(headerCells).toHaveCount(33); // 1 nombre + 31 días + 1 contadores
  126 |   } catch (e) {
  127 |     await screenshotOnFail(page, "CP-05");
  128 |     throw e;
  129 |   }
  130 | });
  131 | 
  132 | // ===========================================================================
  133 | // CP-06 — Colores de turno correctos
  134 | // ===========================================================================
  135 | test("CP-06 — Colores de turno coinciden con la paleta definida", async ({ page }) => {
  136 |   try {
  137 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  138 |     await expect(page).toHaveURL("/");
  139 | 
  140 |     // Verificamos cada color buscando una celda con ese código en la leyenda
  141 |     for (const [shiftCode, expectedColor] of Object.entries(SHIFT_COLORS)) {
  142 |       const legendCell = page
  143 |         .locator(`div.mt-6 span`)
  144 |         .filter({ hasText: new RegExp(`^${shiftCode}$`) })
  145 |         .first();
  146 | 
  147 |       await expect(legendCell).toBeVisible();
  148 |       await expect(legendCell).toHaveCSS("background-color", expectedColor);
  149 |     }
  150 |   } catch (e) {
  151 |     await screenshotOnFail(page, "CP-06");
  152 |     throw e;
  153 |   }
  154 | });
  155 | 
  156 | // ===========================================================================
  157 | // CP-07 — Contadores de turno en formato "Turno:N"
  158 | // ===========================================================================
  159 | test("CP-07 — Contadores de turno visibles en formato Turno:N", async ({ page }) => {
  160 |   try {
  161 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  162 |     await expect(page).toHaveURL("/");
  163 | 
  164 |     // La primera fila de datos (Admin) debe tener contadores J: (jornada normal)
  165 |     const firstRowCounters = page.locator("tbody tr").first().locator("td").last();
  166 |     await expect(firstRowCounters).toBeVisible();
  167 | 
  168 |     // Verificar que al menos un badge tiene formato X:N
  169 |     const badges = firstRowCounters.locator("span");
  170 |     const count = await badges.count();
  171 |     expect(count).toBeGreaterThan(0);
  172 | 
  173 |     const firstBadgeText = await badges.first().textContent();
  174 |     expect(firstBadgeText).toMatch(/^[MTNJDVB]{1,2}:\d+$/);
  175 |   } catch (e) {
  176 |     await screenshotOnFail(page, "CP-07");
  177 |     throw e;
  178 |   }
  179 | });
  180 | 
  181 | // ===========================================================================
  182 | // CP-08 — Fines de semana resaltados en el encabezado
  183 | // ===========================================================================
  184 | test("CP-08 — Columnas de fin de semana tienen fondo azul claro", async ({ page }) => {
  185 |   try {
  186 |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
```