import atkPlugin from 'plugins/atkPlugin';

export default class fileUpload extends atkPlugin {

  main() {
    const that = this;

    this.textInput = this.$el.find('input[type="text"]');
    this.textInput.attr('readonly', true);

    this.fileInput = this.$el.find('input[type="file"]');
    this.action = $('#' + this.settings.action);
    this.actionContent = this.action.html();

    this.bar = this.$el.find('.progress')
      .progress({
        text : {
          active: '{percent}%',
          success: this.settings.completeLabel,
        }
      })
      .hide();

    // Open file dialog on focus.
    if (this.settings.hasFocus) {
      this.textInput.on('focus', function(e) {
        if (!e.target.value) {
          that.fileInput.click();
        }
      });
    }

    // add event handler to action button.
    this.action.on('click', function(e) {
      if (!that.textInput.val()) {
        that.fileInput.click();
      } else {
        that.doFileDelete(that.textInput.val());
      }
    });

    // add event handler to file input.
    this.fileInput.on('change', function(e) {
      if (e.target.files.length > 0) {
        that.textInput.val( e.target.files[0].name);
        that.doFileUpload(e.target.files[0]);
      }
    })
  }

  /**
   * Set the action button html content.
   * Set the input text content.
   */
  setState(mode) {
    const that = this;

    switch (mode) {
      case 'delete':
        this.action.html(this.getEraseContent);
        setTimeout(function() {
          that.bar.hide('fade');
        }, 1000);
        break;
      case 'upload':
        this.action.html(this.actionContent);
        this.textInput.val('');
        this.fileInput.val('');
        break;
    }
  }

  /**
   * Do the actual file uploading process.
   *
   * @param file
   */
  doFileUpload(file) {

    const that = this;
    const fileName = file.name;

    if (this.settings.submit) {
      $('#'+this.settings.submit).addClass('disabled');
    }

    let formData = new FormData();
    formData.append('file', file);
    formData.append('action', 'upload');

    that.bar.progress('reset');
    that.bar.show();

    this.$el.api({
      on: 'now',
      url: this.settings.uri,
      cache: false,
      processData: false,
      contentType: false,
      data: formData,
      method: 'POST',
      obj: this.$el,
      xhr: function () {
        let xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener("progress", function (evt) {
          if (evt.lengthComputable) {
            let percentComplete = evt.loaded / evt.total;
            that.bar.progress('set percent', parseInt(percentComplete * 100));
          }
        }, false);
        return xhr;
      },
      onComplete: function(response, content) {
        if (response.success) {
          that.setState('delete');
        }
        if (that.settings.submit) {
          $('#'+that.settings.submit).removeClass('disabled');
        }
      }
    });
  }

  /**
   * Callback server for file delete.
   *
   * @param fileName
   */
  doFileDelete(fileName) {

    const that = this;

    this.$el.api({
      on: 'now',
      url: this.settings.uri,
      data: {'action': 'delete', 'f_name': fileName},
      method: 'POST',
      obj: this.$el,
      onComplete: function(response, content) {
        if (response.success) {
          that.setState('upload');
        }
      }
    });
  }

  /**
   * Return the html content for erase action button.
   *
   * @returns {string}
   */
  getEraseContent() {
    return `<i class="red remove icon" style=""></i>`;
  }
}


fileUpload.DEFAULTS = {
  uri: null,
  uri_options: {},
  hasFocus: true,
  action: null,
  completeLabel: '100%',
  submit: null
};
