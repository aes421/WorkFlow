function Settings(props){
  //setup because first time through will crash otherwise
  props.settings.flowTimeSlider = !props.settings.flowTimeSlider ? "0" : props.settings.flowTimeSlider;
  props.settings.shortBreakTimeSlider = !props.settings.shortBreakTimeSlider ? "0" : props.settings.shortBreakTimeSlider;
  props.settings.longBreakTimeSlider = !props.settings.longBreakTimeSlider ? "0" : props.settings.longBreakTimeSlider;
  
  return(
    <Page>
      <Section
        title={<Text bold align="center">WorkFlow Settings</Text>}>
        <Text>Flow Time in minutes</Text>
        <Slider
            label= {props.settings.flowTimeSlider.substring(1,props.settings.flowTimeSlider.length-1)}
            settingsKey="flowTimeSlider"
            min="0"
            max="240"
          />
          <Text>Short Break Time in minutes</Text>
      
        <Slider
            label= {props.settings.shortBreakTimeSlider.substring(1,props.settings.shortBreakTimeSlider.length-1)}
            settingsKey="shortBreakTimeSlider"
            min="0"
            max="60"
          />
        
        <Text>Long Break Time in minutes</Text>
        
        <Slider
            label= {props.settings.longBreakTimeSlider.substring(1,props.settings.longBreakTimeSlider.length-1)}
            settingsKey="longBreakTimeSlider"
            min="0"
            max="60"
          />
      </Section>
    </Page>
  );
}


registerSettingsPage(Settings);