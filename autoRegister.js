class AutoRegister {
  constructor(classList, interval = 1000) {
    this.classList = classList.map((c) => {
      c.registered = false;
      return c;
    });
    this.interval = interval;
    this.intervalHandle = null;
    this.clearLogIntervalHandle = null;
  }

  async checkClassAvailable(courseID, classCode) {
    let res = await $.post(
      "https://sv.haui.edu.vn/ajax/register/action.htm?cmd=classbymodulesid&v=" +
        kverify,
      {
        fid: courseID,
      }
    );
    let classInfo = JSON.parse(res);
    for (const cl of classInfo.data) {
      if (cl.ClassCode == classCode && cl.CountS < cl.MaxStudent) {
        return cl;
      }
    }
    return null;
  }

  async registerIndependentClass(independentClassID) {
    let res = await $.post(
      "/ajax/register/action.htm?cmd=addclass&v=" + kverify,
      { class: independentClassID }
    );
    return res;
  }

  async checkStatus() {
    let res = await $.post(
      "https://sv.haui.edu.vn/ajax/register/action.htm?cmd=listorder&v=" +
        kverify
    );
    let status = JSON.parse(res);
    for (const c of this.classList) {
      let filteredClass = status.filter(
        (cl) => cl.stid == "2" && cl.cc == c.classCode && !c.registered
      );
      if (filteredClass.length) {
        c.registered = true;
        new Notification(`Đăng ký thành công lớp ${c.classCode}`);
      }
    }
    let unregisteredClass = this.classList.filter((c) => !c.registered);
    if (!unregisteredClass.length) {
      new Notification("All courses are registered");
      this.stop();
    }
  }

  async run() {
    console.info(
      "\n=======================================================================\n"
    );
    for (const cl of this.classList) {
      if (cl.registered) {
        continue;
      }
      console.info(`Checking class ${cl.courseID} status...`);
      let cls = await this.checkClassAvailable(cl.courseID, cl.classCode);
      if (cls) {
        console.info(
          `Class ${cls.ModulesName} - ${cls.IndependentClassID} is available. Sending register request...`
        );
        await this.registerIndependentClass(cls.IndependentClassID);
      } else {
        console.info(`Class ${cl.courseID} is not available`);
      }
    }

    await this.checkStatus();
  }

  async start() {
    this.run();
    this.intervalHandle = setInterval(() => this.run(), this.interval);
    this.clearLogIntervalHandle = setInterval(
      () => console.clear(),
      this.interval * 20
    );
    return this.intervalHandle;
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
    if (this.clearLogIntervalHandle) {
      clearInterval(this.clearLogIntervalHandle);
    }
    return true;
  }
}

let classList = [
  {
    classCode: "20232IT6084010",
    courseID: 7183,
  },
];

let auto = new AutoRegister(classList);
auto.start();
