function Settings(props){
  //setup because first time through will crash otherwise
  props.settings.flowTime = !props.settings.flowTime ? "25" : props.settings.flowTime;
  props.settings.shortBreakTime = !props.settings.shortBreakTime ? "5" : props.settings.shortBreakTime;
  props.settings.longBreakTime = !props.settings.longBreakTime ? "15" : props.settings.longBreakTime;
  
  return(
    <Page>
      <Section
        title={<Text bold align="center">WorkFlow Settings</Text>}>
        <Text>Flow Time in minutes</Text>
        <Button label="+" onClick={()=> {
            let t = parseInt(props.settings.flowTime) + 1;
            props.settingsStorage.setItem('flowTime', t.toString());
        }}/>
        <Text align="center">{props.settings.flowTime}</Text>
        <Button label="-" onClick={()=> {
            if (props.settings.flowTime > 1){
              let t = parseInt(props.settings.flowTime) - 1;
              props.settingsStorage.setItem('flowTime', t.toString());
            }
         }}/>

        <Text>Short Break Time in minutes</Text>
        <Button label="+" onClick={()=> {
            let t = parseInt(props.settings.shortBreakTime) + 1;
            props.settingsStorage.setItem('shortBreakTime', t.toString());
        }}/>
        <Text align="center">{props.settings.shortBreakTime}</Text>
        <Button label="-" onClick={()=> {
            if (props.settings.shortBreakTime > 1){
              let t = parseInt(props.settings.shortBreakTime) - 1;
              props.settingsStorage.setItem('shortBreakTime', t.toString());
            }
         }}/>
        
        <Text>Long Break Time in minutes</Text>
        <Button label="+" onClick={()=> {
            let t = parseInt(props.settings.longBreakTime) + 1;
            props.settingsStorage.setItem('longBreakTime', t.toString());
        }}/>
        <Text align="center">{props.settings.longBreakTime}</Text>
        <Button label="-" onClick={()=> {
            if (props.settings.longBreakTime > 1){
              let t = parseInt(props.settings.longBreakTime) - 1;
              props.settingsStorage.setItem('longBreakTime', t.toString());
            }
         }}/>
      </Section>
    </Page>
  );
}


registerSettingsPage(Settings);